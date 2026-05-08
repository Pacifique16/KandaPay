import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

export const CONTACTS_CACHE_KEY = '@kandapay_contacts_cache';

export type CachedContact = {
  id: string;
  name: string;
  phone: string;
  initials: string;
  color: string;
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
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') return;
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.FirstName,
    });
    const COLORS = ['#6C63FF', '#1A237E', '#00C9A7', '#4A47A3', '#F59E0B', '#EC4899'];
    const mapped: CachedContact[] = [];
    data.forEach((c, i) => {
      const name = c.name ?? '';
      (c.phoneNumbers ?? []).forEach((p) => {
        if (p.number) {
          mapped.push({
            id: `${c.id}-${p.id ?? i}`,
            name,
            phone: p.number,
            initials: name.slice(0, 1).toUpperCase() || '?',
            color: COLORS[mapped.length % COLORS.length],
          });
        }
      });
    });
    _contacts = mapped;
    _loaded = true;
    await AsyncStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify(mapped));
  } catch {}
}
