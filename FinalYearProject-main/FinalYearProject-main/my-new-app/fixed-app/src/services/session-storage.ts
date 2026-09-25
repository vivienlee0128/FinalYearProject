import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface StoredSession { accessToken: string; refreshToken?: string; expiresAt: number }
const key = 'swinburne.session.v1';
let webSession: StoredSession | null = null;

// Native tokens use encrypted OS storage. Web tokens deliberately stay in memory.
export async function readSession(): Promise<StoredSession | null> {
  if (Platform.OS === 'web') return webSession;
  const value = await SecureStore.getItemAsync(key);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed.accessToken === 'string' && Number.isFinite(parsed.expiresAt) ? parsed : null;
  } catch { return null; }
}
export async function writeSession(session: StoredSession | null) {
  if (Platform.OS === 'web') { webSession = session; return; }
  if (session) await SecureStore.setItemAsync(key, JSON.stringify(session));
  else await SecureStore.deleteItemAsync(key);
}
