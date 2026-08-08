import { Platform } from 'react-native';

const DEV_API = 'http://localhost:3000/api';
const PROD_API = 'https://tradedesk-mu-khaki.vercel.app/api';

export const API_BASE = __DEV__ ? DEV_API : PROD_API;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Token storage abstraction — uses expo-secure-store on native, localStorage on web
let getToken: () => Promise<string | null> = async () => null;
let setToken: (t: string | null) => Promise<void> = async () => {};

// Conditional import to avoid web issues
async function initSecureStore() {
  if (Platform.OS === 'web') {
    getToken = async () => localStorage.getItem('td_token');
    setToken = async (t) => {
      if (t) localStorage.setItem('td_token', t);
      else localStorage.removeItem('td_token');
    };
  } else {
    try {
      const SecureStore = await import('expo-secure-store');
      getToken = async () => {
        try { return await SecureStore.getItemAsync('td_token'); } catch { return null; }
      };
      setToken = async (t) => {
        if (t) await SecureStore.setItemAsync('td_token', t);
        else await SecureStore.deleteItemAsync('td_token').catch(() => {});
      };
    } catch {
      // Fallback to in-memory
      let memToken: string | null = null;
      getToken = async () => memToken;
      setToken = async (t) => { memToken = t; };
    }
  }
}

initSecureStore();

export { setToken };
