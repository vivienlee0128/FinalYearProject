import { refreshAsync, TokenResponse } from 'expo-auth-session';
import { AppState } from 'react-native';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiRequest, ApiError, withTimeout } from '../services/api';
import { authConfig, tokenEndpoint, scopes } from '../services/config';
import { readSession, StoredSession, writeSession } from '../services/session-storage';

export interface AuthUser {
  name: string; email: string; student: string | null; sisId: string | null;
  role: 'student' | 'lecturer'; method: 'microsoft';
}
interface AuthContextType {
  isAuthenticated: boolean; isLoading: boolean; user: AuthUser | null; error: string | null;
  signIn: (tokens: TokenResponse) => Promise<void>;
  signOut: () => Promise<void>;
  request: (path: string, options?: RequestInit) => Promise<Response>;
}
const Auth = createContext<AuthContextType | null>(null);
function fromTokens(tokens: TokenResponse, previous?: StoredSession): StoredSession {
  if (!tokens.accessToken || !tokens.expiresIn) throw new Error('Microsoft did not return a usable API access token.');
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken ?? previous?.refreshToken,
    expiresAt: ((tokens.issuedAt ?? Date.now() / 1000) + tokens.expiresIn) * 1000 };
}
function validateProfile(profile: AuthUser) {
  if (!['student', 'lecturer'].includes(profile.role) || (profile.role === 'student' && (!profile.student || !profile.sisId))) {
    throw new Error('Your university account has no valid role or student mapping. Contact the administrator.');
  }
  return profile;
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const session = useRef<StoredSession | null>(null);
  const generation = useRef(0);
  const refreshing = useRef<Promise<StoredSession> | null>(null);
  const signOut = useCallback(async () => {
    generation.current++; session.current = null; refreshing.current = null; setUser(null);
    try { await writeSession(null); } catch { setError('Could not clear saved credentials. Clear app storage before sharing this device.'); }
  }, []);
  const activeSession = useCallback(async (): Promise<StoredSession> => {
    const current = session.current;
    if (!current) throw new Error('Please sign in again.');
    if (current.expiresAt > Date.now() + 60000) return current;
    if (!current.refreshToken) { await signOut(); throw new Error('Your session expired. Please sign in again.'); }
    if (!refreshing.current) {
      const version = generation.current;
      refreshing.current = (async () => {
        try {
          const tokens = await withTimeout(refreshAsync({ clientId: authConfig.clientId, refreshToken: current.refreshToken!, scopes }, { tokenEndpoint }));
          if (version !== generation.current) throw new Error('Sign-in was cancelled.');
          const next = fromTokens(tokens, current);
          await writeSession(next);
          if (version !== generation.current) { await writeSession(null); throw new Error('Sign-in was cancelled.'); }
          session.current = next;
          return next;
        } catch {
          if (version === generation.current) await signOut();
          throw new Error('Your session could not be renewed. Please sign in again.');
        } finally { refreshing.current = null; }
      })();
    }
    return refreshing.current;
  }, [signOut]);
  const request = useCallback(async (path: string, options?: RequestInit) => {
    const current = await activeSession();
    try { return await apiRequest(path, current.accessToken, options); }
    catch (err) {
      if (err instanceof ApiError && err.status === 401) await signOut();
      throw err;
    }
  }, [activeSession, signOut]);
  const signIn = useCallback(async (tokens: TokenResponse) => {
    const version = ++generation.current;
    const next = fromTokens(tokens);
    const response = await apiRequest('/auth/me', next.accessToken);
    const profile = validateProfile(await response.json());
    if (version !== generation.current) throw new Error('Sign-in was cancelled.');
    await writeSession(next);
    if (version !== generation.current) { await writeSession(null); throw new Error('Sign-in was cancelled.'); }
    session.current = next; setUser(profile); setError(null);
  }, []);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await readSession();
        if (!mounted) return;
        session.current = saved;
        if (saved) {
          const response = await request('/auth/me');
          const profile = validateProfile(await response.json());
          if (mounted) setUser(profile);
        }
      } catch {
        if (mounted) { await signOut(); setError('Your previous session could not be restored. Please sign in again.'); }
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [request, signOut]);
  useEffect(() => {
    if (!user) return;
    const check = () => { void activeSession().catch(() => setError('Your session expired. Please sign in again.')); };
    const interval = setInterval(check, 30000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') check(); });
    return () => { clearInterval(interval); listener.remove(); };
  }, [user, activeSession]);
  return <Auth.Provider value={{ isAuthenticated: !!user, isLoading, user, error, signIn, signOut, request }}>{children}</Auth.Provider>;
}
export function useAuth() {
  const context = useContext(Auth);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
