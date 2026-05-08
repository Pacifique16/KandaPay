import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, Platform } from 'react-native';

export const CONTACTS_CACHE_KEY = '@kandapay_contacts_cache';

export type CachedContact = {
  id: string;
  name: string;
  phone: string;
  phones?: string[];
  initials: string;
  color: string;
  imageUri?: string;
};

let _contacts: CachedContact[] = [];
let _loaded = false;
let _listenerRegistered = false;
let _lastRefresh = 0;
const REFRESH_COOLDOWN_MS = 10000; // min 10s between refreshes

export function getContactsSync(): CachedContact[] { return _contacts; }
export function isContactsLoaded(): boolean { return _loaded; }

export function setContactsCache(contacts: CachedContact[]): void {
  _contacts = contacts;
  _loaded = true;
  AsyncStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify(contacts));
}

export function invalidateContactsCache(): void {
  _loaded = false;
  _contacts = [];
  AsyncStorage.removeItem(CONTACTS_CACHE_KEY);
}

export async function preloadContactsCache(): Promise<void> {
  if (!_loaded) {
    try {
      const cached = await AsyncStorage.getItem(CONTACTS_CACHE_KEY);
      if (cached) {
        _contacts = JSON.parse(cached);
        _loaded = true;
      }
    } catch {}
  }

  // Always refresh in background
  _refreshContactsInBackground();

  // Register AppState listener only once
  if (!_listenerRegistered) {
    _listenerRegistered = true;
    AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        const now = Date.now();
        if (now - _lastRefresh > REFRESH_COOLDOWN_MS) {
          _refreshContactsInBackground();
        }
      }
    });
  }
}

async function _refreshContactsInBackground(): Promise<void> {
  _lastRefresh = Date.now();
  try {
    const Contacts = await import('expo-contacts');
    const { status } = Platform.OS === 'android'
      ? await Contacts.requestPermissionsAsync()
      : { status: 'granted' };
    if (status !== 'granted') return;
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
      sort: Contacts.SortTypes.FirstName,
    });
    const mapped: CachedContact[] = [];
    const seenNames = new Set<string>();
    data.forEach((c) => {
      const name = (c.name ?? '').trim();
      if (!name || name.length < 2) return;
      if (/^[\d\s\+\-\(\)]+$/.test(name)) return;
      const phones = c.phoneNumbers ?? [];
      if (phones.length === 0) return;
      const key = `${name}-${phones[0].number?.replace(/\D/g, '') ?? ''}`;
      if (seenNames.has(key)) return;
      seenNames.add(key);
      // Store all phone numbers in the first entry
      mapped.push({
        id: c.id ?? key,
        name,
        phone: phones[0].number ?? '',
        phones: phones.map(p => p.number ?? '').filter(Boolean),
        initials: name.slice(0, 1).toUpperCase() || '?',
        color: '#1A237E',
        imageUri: c.image?.uri,
      });
    });
    _contacts = mapped;
    _loaded = true;
    await AsyncStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify(mapped));
  } catch {}
}
