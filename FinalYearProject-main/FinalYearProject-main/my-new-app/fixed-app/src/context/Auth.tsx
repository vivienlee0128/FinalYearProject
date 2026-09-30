import { refreshAsync, TokenResponse } from 'expo-auth-session';
import { jwtDecode } from 'jwt-decode';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  authConfig,
  scopes,
  tokenEndpoint,
} from '../services/config';

/**
 * Basic information returned from Microsoft Entra.
 *
 * For the proof-of-concept we are NOT calling /auth/me.
 */
interface MicrosoftIdTokenClaims {
  name?: string;
  preferred_username?: string;
  email?: string;
  upn?: string;
  oid?: string;
  sub?: string;
  exp?: number;
}

// export interface AuthUser {
//   name: string;
//   email: string;

//   /**
//    * These are kept for compatibility with the rest
//    * of your existing application.
//    *
//    * They will eventually come from your student
//    * profile API / Qwickly integration.
//    */
//   student: string | null;
//   sisId: string | null;

//   role: 'student' | 'lecturer';
//   method: 'microsoft';
// }

export interface AuthUser {
  name: string;
  email: string;

  // Will eventually come from Student Profile API
  studentId: string | null;
  sisId: string | null;

  method: 'microsoft';
}

interface StoredSession {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;

  user: AuthUser | null;
  error: string | null;

  signIn: (tokens: TokenResponse) => Promise<void>;
  signOut: () => Promise<void>;

  /**
   * Returns a valid Microsoft access token.
   *
   * This is useful later when n8n needs the
   * authenticated user's token.
   */
  getAccessToken: () => Promise<string>;
}

const Auth = createContext<AuthContextType | null>(null);

/**
 * Convert Expo's TokenResponse into the internal
 * session format used by the application.
 */
function fromTokens(
  tokens: TokenResponse,
  previous?: StoredSession
): StoredSession {
  if (!tokens.accessToken) {
    throw new Error(
      'Microsoft did not return an access token.'
    );
  }

  /**
   * Microsoft normally supplies expiresIn.
   * Use one hour as a fallback for the POC.
   */
  const expiresIn = tokens.expiresIn ?? 3600;

  const issuedAt =
    tokens.issuedAt ?? Date.now() / 1000;

  return {
    accessToken: tokens.accessToken,

    refreshToken:
      tokens.refreshToken ??
      previous?.refreshToken,

    idToken:
      tokens.idToken ??
      previous?.idToken,

    expiresAt:
      (issuedAt + expiresIn) * 1000,
  };
}

/**
 * Create our local user object directly from the
 * Microsoft ID token.
 *
 * This replaces the old:
 *
 * GET 192.168.100.25:6522/api/auth/me
 */
// function userFromToken(
//   tokens: TokenResponse
// ): AuthUser {
//   if (!tokens.idToken) {
//     throw new Error(
//       'Microsoft did not return an ID token.'
//     );
//   }

//   let claims: MicrosoftIdTokenClaims;

//   try {
//     claims =
//       jwtDecode<MicrosoftIdTokenClaims>(
//         tokens.idToken
//       );
//   } catch {
//     throw new Error(
//       'Unable to read the Microsoft ID token.'
//     );
//   }

//   const email =
//     claims.preferred_username ??
//     claims.email ??
//     claims.upn ??
//     '';

//   if (!email) {
//     throw new Error(
//       'Microsoft account did not provide an email address.'
//     );
//   }

//   /**
//    * IMPORTANT:
//    *
//    * For this POC we're assigning lecturer because
//    * we're testing the lecturer attendance screen.
//    *
//    * Later, role should come from Entra app roles,
//    * your Student Profile API, or another trusted
//    * university source.
//    */
//   return {
//   name: claims.name ?? email,
//   email,

//   // Mock/unknown until Student Profile API is connected
//   studentId: null,
//   sisId: null,

//   method: 'microsoft',
//   };
// }

  function userFromToken(tokens: TokenResponse): AuthUser {
    if (!tokens.idToken) {
      throw new Error(
        'Microsoft did not return an ID token.'
      );
    }

    const claims = jwtDecode<MicrosoftIdTokenClaims>(
      tokens.idToken
    );

    const email =
      claims.preferred_username ??
      claims.email;

    if (!email) {
      throw new Error(
        'Microsoft account has no email address.'
      );
    }

    const studentId =
      studentIdFromEmail(email);

    if (!studentId) {
      throw new Error(
        'This application is only available to Swinburne student accounts.'
      );
    }

    return {
      name: claims.name ?? email,
      email,
      studentId,
      sisId: studentId,
      method: 'microsoft',
    };
  }
export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [isLoading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const session =
    useRef<StoredSession | null>(null);

  const refreshing =
    useRef<Promise<StoredSession> | null>(
      null
    );

  /**
   * Sign out locally.
   *
   * For this POC no credentials are written
   * to AsyncStorage / SecureStore.
   */
  const signOut =
    useCallback(async () => {
      session.current = null;
      refreshing.current = null;

      setUser(null);
      setError(null);

      console.log(
        '[AUTH] Signed out.'
      );
    }, []);

  /**
   * Return a valid session.
   *
   * Refresh the Microsoft access token if it is
   * close to expiring.
   */
  const activeSession =
    useCallback(
      async (): Promise<StoredSession> => {
        const current = session.current;

        if (!current) {
          throw new Error(
            'Please sign in again.'
          );
        }

        /**
         * Token still has more than one minute
         * remaining.
         */
        if (
          current.expiresAt >
          Date.now() + 60_000
        ) {
          return current;
        }

        if (!current.refreshToken) {
          await signOut();

          throw new Error(
            'Your Microsoft session expired. Please sign in again.'
          );
        }

        if (!refreshing.current) {
          refreshing.current =
            (async () => {
              try {
                console.log(
                  '[AUTH] Refreshing Microsoft token...'
                );

                const tokens =
                  await refreshAsync(
                    {
                      clientId:
                        authConfig.clientId,

                      refreshToken:
                        current.refreshToken!,

                      scopes,
                    },
                    {
                      tokenEndpoint,
                    }
                  );

                const next =
                  fromTokens(
                    tokens,
                    current
                  );

                session.current = next;

                console.log(
                  '[AUTH] Token refreshed.'
                );

                return next;
              } catch (err) {
                console.error(
                  '[AUTH] Token refresh failed:',
                  err
                );

                await signOut();

                throw new Error(
                  'Your Microsoft session could not be renewed. Please sign in again.'
                );
              } finally {
                refreshing.current = null;
              }
            })();
        }

        return refreshing.current;
      },
      [signOut]
    );

  /**
   * Called after index.tsx successfully exchanges
   * the Microsoft authorization code.
   */
  const signIn =
    useCallback(
      async (
        tokens: TokenResponse
      ) => {
        try {
          setError(null);

          console.log(
            '=============================='
          );

          console.log(
            '[AUTH] Microsoft token received'
          );

          console.log(
            '[AUTH] Access token:',
            tokens.accessToken
              ? 'YES'
              : 'NO'
          );

          console.log(
            '[AUTH] ID token:',
            tokens.idToken
              ? 'YES'
              : 'NO'
          );

          console.log(
            '[AUTH] Refresh token:',
            tokens.refreshToken
              ? 'YES'
              : 'NO'
          );

          /**
           * Never log the actual token.
           */
          const next =
            fromTokens(tokens);

          const profile =
            userFromToken(tokens);

          session.current = next;

          setUser(profile);

          console.log(
            '[AUTH] User:',
            profile.email
          );

          console.log(
            '[AUTH] Microsoft sign-in successful.'
          );

          console.log(
            '=============================='
          );
        } catch (err) {
          console.error(
            '[AUTH] Sign-in failed:',
            err
          );

          session.current = null;
          setUser(null);

          const message =
            err instanceof Error
              ? err.message
              : 'Microsoft sign-in failed.';

          setError(message);

          throw err;
        }
      },
      []
    );

  /**
   * Used later if you want to send the Microsoft
   * access token to n8n.
   */
  const getAccessToken =
    useCallback(async () => {
      const current =
        await activeSession();

      return current.accessToken;
    }, [activeSession]);

  /**
   * POC:
   *
   * We intentionally DON'T restore a previous
   * session from the old backend.
   *
   * Every browser refresh requires login again.
   */
  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <Auth.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        error,
        signIn,
        signOut,
        getAccessToken,
      }}
    >
      {children}
    </Auth.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(Auth);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}

function studentIdFromEmail(email: string): string | null {
  const match = email
    .toLowerCase()
    .match(/^(\d+)@students\.swinburne\.edu\.my$/);

  return match?.[1] ?? null;
}