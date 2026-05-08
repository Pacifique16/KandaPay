import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import { supabase } from './supabase';
import { MerchantLocationSignal, NearbyMerchantResult, VerifiedMerchant } from './supabaseTypes';

const CLUSTER_RADIUS_METERS = 25;
const MIN_UNIQUE_USERS = 3;
const MIN_DAYS = 2;
const CONFIDENCE_THRESHOLD = 70;
const MAX_SPEED_MPS = 50;
const MERCHANTS_CACHE_KEY = '@kandapay_nearby_merchants';
const LOCATION_CACHE_KEY = '@kandapay_last_location';

// In-memory cache — fastest possible access
let _nearbyCache: NearbyMerchantResult[] = [];
let _nearbyCacheLoaded = false;
let _lastLocation: { latitude: number; longitude: number } | null = null;

// ─── Init: call this at app startup ─────────────────────────────────────────

export async function initMerchantIntelligence(): Promise<void> {
  try {
    // Clear all caches to force fresh location and merchant fetch
    await AsyncStorage.multiRemove([MERCHANTS_CACHE_KEY, LOCATION_CACHE_KEY]);
    _nearbyCacheLoaded = false;
    _nearbyCache = [];
    _lastLocation = null;
  } catch {}
  await refreshNearbyMerchantsInBackground();
}

async function refreshNearbyMerchantsInBackground(): Promise<void> {
  try {
    const loc = await getFastLocation();
    if (!loc) {
      console.warn('[MerchantIntelligence] No location available');
      return;
    }
    _lastLocation = loc;
    AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(loc));
    console.log('[MerchantIntelligence] Fetching merchants at', loc.latitude, loc.longitude);
    const { data, error } = await supabase.rpc('get_nearby_merchants', {
      user_lat: loc.latitude,
      user_lng: loc.longitude,
      radius_meters: 1000,
    });
    if (error) {
      console.warn('[MerchantIntelligence] RPC error:', error);
      return;
    }
    _nearbyCache = (data as NearbyMerchantResult[]) ?? [];
    _nearbyCacheLoaded = true;
    console.log('[MerchantIntelligence] Loaded', _nearbyCache.length, 'merchants');
    AsyncStorage.setItem(MERCHANTS_CACHE_KEY, JSON.stringify(_nearbyCache));
  } catch (e) {
    console.warn('[MerchantIntelligence] refresh error:', e);
  }
}

// ─── Fast Location ───────────────────────────────────────────────────────────

async function getFastLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return _lastLocation;
    // Always get fresh position, don't use last known (it can be very stale)
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return _lastLocation;
  }
}

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return getFastLocation();
}

// ─── Get Nearby Merchants (instant from cache) ───────────────────────────────

export function getNearbyMerchantsSync(): NearbyMerchantResult[] {
  return _nearbyCache;
}

export async function getNearbyMerchants(
  lat: number,
  lng: number,
  radiusMeters = 1000
): Promise<NearbyMerchantResult[]> {
  // Return cache immediately if available
  if (_nearbyCacheLoaded) return _nearbyCache;

  // Otherwise fetch and cache
  try {
    const { data, error } = await supabase.rpc('get_nearby_merchants', {
      user_lat: lat,
      user_lng: lng,
      radius_meters: radiusMeters,
    });
    if (error) throw error;
    _nearbyCache = (data as NearbyMerchantResult[]) ?? [];
    _nearbyCacheLoaded = true;
    AsyncStorage.setItem(MERCHANTS_CACHE_KEY, JSON.stringify(_nearbyCache));
    return _nearbyCache;
  } catch (e) {
    console.warn('[MerchantIntelligence] getNearbyMerchants error:', e);
    return [];
  }
}

// ─── Hashing ─────────────────────────────────────────────────────────────────

export async function getHashedUserId(): Promise<string> {
  const deviceId = `kandapay-${await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `device-salt-${Date.now().toString().slice(0, 8)}`
  )}`;
  return deviceId.slice(0, 32);
}

// ─── Distance ────────────────────────────────────────────────────────────────

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Fraud Prevention ────────────────────────────────────────────────────────

async function isSuspiciousSubmission(hashedUserId: string, lat: number, lng: number): Promise<boolean> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from('merchant_location_signals')
    .select('latitude, longitude, timestamp')
    .eq('hashed_user_id', hashedUserId)
    .gte('timestamp', fiveMinutesAgo)
    .limit(5);

  if (recent && recent.length > 3) return true;
  if (recent && recent.length > 0) {
    const last = recent[recent.length - 1];
    const dist = haversineDistance(last.latitude, last.longitude, lat, lng);
    const timeDiff = (Date.now() - new Date(last.timestamp).getTime()) / 1000;
    if (timeDiff > 0 && dist / timeDiff > MAX_SPEED_MPS) return true;
  }
  return false;
}

// ─── Submit Signal ────────────────────────────────────────────────────────────

export async function submitMerchantSignal(merchantCode: string, lat: number, lng: number): Promise<void> {
  try {
    const hashedUserId = await getHashedUserId();
    if (await isSuspiciousSubmission(hashedUserId, lat, lng)) return;

    const signal: MerchantLocationSignal = {
      merchant_code: merchantCode,
      latitude: lat,
      longitude: lng,
      hashed_user_id: hashedUserId,
      timestamp: new Date().toISOString(),
      transaction_count: 1,
    };
    await supabase.from('merchant_location_signals').insert(signal);
    runClusteringCheck(merchantCode, lat, lng);
  } catch (e) {
    console.warn('[MerchantIntelligence] submitMerchantSignal error:', e);
  }
}

// ─── Clustering ───────────────────────────────────────────────────────────────

async function runClusteringCheck(merchantCode: string, lat: number, lng: number): Promise<void> {
  try {
    const { data: signals } = await supabase
      .from('merchant_location_signals')
      .select('latitude, longitude, hashed_user_id, timestamp')
      .eq('merchant_code', merchantCode);

    if (!signals || signals.length < MIN_UNIQUE_USERS) return;

    const clustered = signals.filter(
      (s) => haversineDistance(s.latitude, s.longitude, lat, lng) <= CLUSTER_RADIUS_METERS
    );
    if (clustered.length < MIN_UNIQUE_USERS) return;

    const uniqueUsers = new Set(clustered.map((s) => s.hashed_user_id)).size;
    if (uniqueUsers < MIN_UNIQUE_USERS) return;

    const uniqueDays = new Set(clustered.map((s) => new Date(s.timestamp).toDateString())).size;
    if (uniqueDays < MIN_DAYS) return;

    const score = Math.round(
      Math.min(clustered.length / 20, 1) * 30 +
      Math.min(uniqueUsers / 10, 1) * 40 +
      Math.min(uniqueDays / 7, 1) * 30
    );

    const centroidLat = clustered.reduce((sum, s) => sum + s.latitude, 0) / clustered.length;
    const centroidLng = clustered.reduce((sum, s) => sum + s.longitude, 0) / clustered.length;

    const merchant: VerifiedMerchant = {
      merchant_code: merchantCode,
      merchant_name: merchantCode,
      latitude: centroidLat,
      longitude: centroidLng,
      confidence_score: score,
      usage_count: clustered.length,
      verified: score >= CONFIDENCE_THRESHOLD,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('verified_merchants').upsert(merchant, { onConflict: 'merchant_code' });

    // Invalidate cache so next open refreshes
    _nearbyCacheLoaded = false;
    AsyncStorage.removeItem(MERCHANTS_CACHE_KEY);
  } catch (e) {
    console.warn('[MerchantIntelligence] runClusteringCheck error:', e);
  }
}

export async function submitMerchantAlias(merchantCode: string, alias: string): Promise<void> {
  try {
    await supabase.from('merchant_aliases').upsert(
      { merchant_code: merchantCode, alias, votes: 1 },
      { onConflict: 'merchant_code,alias' }
    );
    const { data } = await supabase
      .from('merchant_aliases')
      .select('alias, votes')
      .eq('merchant_code', merchantCode)
      .order('votes', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      await supabase.from('verified_merchants').update({ merchant_name: data[0].alias }).eq('merchant_code', merchantCode);
    }
  } catch (e) {
    console.warn('[MerchantIntelligence] submitMerchantAlias error:', e);
  }
}
