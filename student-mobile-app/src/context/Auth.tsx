import {
  refreshAsync,
  TokenResponse,
} from 'expo-auth-session';

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


// ============================================================
// MICROSOFT TOKEN CLAIMS
// ============================================================

interface MicrosoftIdTokenClaims {
  name?: string;
  preferred_username?: string;
  email?: string;
  upn?: string;
  oid?: string;
  sub?: string;
  exp?: number;
}


// ============================================================
// AUTHENTICATED USER
// ============================================================

export interface AuthUser {
  name: string;
  email: string;

  studentId: string | null;
  sisId: string | null;

  /*
   * microsoft:
   * User authenticated normally using Microsoft Entra.
   *
   * development:
   * Local development user used when running inside Expo Go.
   */
  method:
    | 'microsoft'
    | 'development';
}


// ============================================================
// MICROSOFT SESSION
// ============================================================

interface StoredSession {
  accessToken: string;

  refreshToken?: string;

  idToken?: string;

  expiresAt: number;
}


// ============================================================
// AUTH CONTEXT
// ============================================================

interface AuthContextType {
  isAuthenticated: boolean;

  isLoading: boolean;

  user: AuthUser | null;

  error: string | null;


  /*
   * Real Microsoft authentication.
   */
  signIn:
    (
      tokens: TokenResponse
    ) => Promise<void>;


  /*
   * Expo Go development authentication.
   *
   * This DOES NOT create a Microsoft session.
   */
  developmentSignIn:
    () => Promise<void>;


  signOut:
    () => Promise<void>;


  /*
   * Returns the Microsoft access token.
   *
   * Only available when:
   *
   * user.method === 'microsoft'
   */
  getAccessToken:
    () => Promise<string>;
}


const Auth =
  createContext<AuthContextType | null>(
    null
  );


// ============================================================
// TOKEN → STORED SESSION
// ============================================================

function fromTokens(
  tokens: TokenResponse,
  previous?: StoredSession
): StoredSession {

  if (!tokens.accessToken) {

    throw new Error(
      'Microsoft did not return an access token.'
    );

  }


  /*
   * Microsoft normally returns expiresIn.
   *
   * One hour is used as a fallback.
   */
  const expiresIn =
    tokens.expiresIn ??
    3600;


  const issuedAt =
    tokens.issuedAt ??
    Date.now() / 1000;


  return {

    accessToken:
      tokens.accessToken,


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


// ============================================================
// MICROSOFT TOKEN → STUDENT
// ============================================================

function userFromToken(
  tokens: TokenResponse
): AuthUser {

  if (!tokens.idToken) {

    throw new Error(
      'Microsoft did not return an ID token.'
    );

  }


  let claims:
    MicrosoftIdTokenClaims;


  try {

    claims =
      jwtDecode<MicrosoftIdTokenClaims>(
        tokens.idToken
      );

  } catch {

    throw new Error(
      'Unable to read the Microsoft ID token.'
    );

  }


  const email =
    claims.preferred_username ??
    claims.email ??
    claims.upn ??
    '';


  if (!email) {

    throw new Error(
      'Microsoft account did not provide an email address.'
    );

  }


  /*
   * Student email example:
   *
   * 104404156@students.swinburne.edu.my
   *
   * becomes:
   *
   * 104404156
   */
  const studentId =
    studentIdFromEmail(
      email
    );


  if (!studentId) {

    throw new Error(
      'This application is only available to Swinburne student accounts.'
    );

  }


  return {

    name:
      claims.name ??
      email,

    email,

    studentId,

    sisId:
      studentId,

    method:
      'microsoft',

  };

}


// ============================================================
// AUTH PROVIDER
// ============================================================

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [
    user,
    setUser,
  ] =
    useState<AuthUser | null>(
      null
    );


  const [
    isLoading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  // ----------------------------------------------------------
  // MICROSOFT SESSION
  // ----------------------------------------------------------

  const session =
    useRef<StoredSession | null>(
      null
    );


  const refreshing =
    useRef<
      Promise<StoredSession> | null
    >(
      null
    );


  // ==========================================================
  // SIGN OUT
  // ==========================================================

  const signOut =
    useCallback(
      async () => {

        session.current =
          null;

        refreshing.current =
          null;


        setUser(
          null
        );

        setError(
          null
        );


        console.log(
          '=============================='
        );

        console.log(
          '[AUTH] Signed out.'
        );

        console.log(
          '=============================='
        );

      },
      []
    );


  // ==========================================================
  // ACTIVE MICROSOFT SESSION
  // ==========================================================

  const activeSession =
    useCallback(
      async (): Promise<StoredSession> => {

        /*
         * Development login intentionally
         * does not have a Microsoft session.
         */
        if (
          user?.method ===
          'development'
        ) {

          throw new Error(
            'Microsoft access tokens are not available in Expo Go development mode.'
          );

        }


        const current =
          session.current;


        if (!current) {

          throw new Error(
            'Please sign in again.'
          );

        }


        /*
         * Token still has more than
         * one minute remaining.
         */
        if (
          current.expiresAt >
          Date.now() + 60_000
        ) {

          return current;

        }


        /*
         * No refresh token means the
         * Microsoft session cannot be renewed.
         */
        if (
          !current.refreshToken
        ) {

          await signOut();


          throw new Error(
            'Your Microsoft session expired. Please sign in again.'
          );

        }


        /*
         * Prevent multiple refresh requests
         * from running simultaneously.
         */
        if (
          !refreshing.current
        ) {

          refreshing.current =
            (
              async () => {

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


                  session.current =
                    next;


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

                  refreshing.current =
                    null;

                }

              }
            )();

        }


        return refreshing.current;

      },
      [
        signOut,
        user,
      ]
    );


  // ==========================================================
  // MICROSOFT SIGN IN
  // ==========================================================

  const signIn =
    useCallback(
      async (
        tokens: TokenResponse
      ) => {

        try {

          setError(
            null
          );


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


          /*
           * Never log the actual Microsoft
           * access/ID/refresh tokens.
           */
          const next =
            fromTokens(
              tokens
            );


          const profile =
            userFromToken(
              tokens
            );


          session.current =
            next;


          refreshing.current =
            null;


          setUser(
            profile
          );


          console.log(
            '[AUTH] User:',
            profile.email
          );


          console.log(
            '[AUTH] SIS ID:',
            profile.sisId
          );


          console.log(
            '[AUTH] Authentication method:',
            profile.method
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


          session.current =
            null;


          refreshing.current =
            null;


          setUser(
            null
          );


          const message =
            err instanceof Error
              ? err.message
              : 'Microsoft sign-in failed.';


          setError(
            message
          );


          throw err;

        }

      },
      []
    );


  // ==========================================================
  // EXPO GO DEVELOPMENT LOGIN
  // ==========================================================

  const developmentSignIn =
    useCallback(
      async () => {

        try {

          setError(
            null
          );


          console.log(
            '=============================='
          );

          console.log(
            '[AUTH] Expo Go development login'
          );


          /*
           * IMPORTANT:
           *
           * This account exists ONLY so that
           * the student application can be
           * tested inside Expo Go.
           *
           * No Microsoft authentication occurs.
           *
           * No Microsoft token is generated.
           */
          const developmentUser:
            AuthUser = {

            name:
              'Fredly Benny ANAK VILEN',

            email:
              '104404156@students.swinburne.edu.my',

            studentId:
              '104404156',

            sisId:
              '104404156',

            method:
              'development',

          };


          /*
           * Make absolutely sure that an old
           * Microsoft session is not reused.
           */
          session.current =
            null;


          refreshing.current =
            null;


          setUser(
            developmentUser
          );


          console.log(
            '[AUTH] Development user:',
            developmentUser.email
          );


          console.log(
            '[AUTH] SIS ID:',
            developmentUser.sisId
          );


          console.log(
            '[AUTH] Authentication method:',
            developmentUser.method
          );


          console.log(
            '[AUTH] Development login successful.'
          );


          console.log(
            '=============================='
          );

        } catch (err) {

          console.error(
            '[AUTH] Development login failed:',
            err
          );


          session.current =
            null;


          refreshing.current =
            null;


          setUser(
            null
          );


          const message =
            err instanceof Error
              ? err.message
              : 'Development login failed.';


          setError(
            message
          );


          throw err;

        }

      },
      []
    );


  // ==========================================================
  // GET MICROSOFT ACCESS TOKEN
  // ==========================================================

  const getAccessToken =
    useCallback(
      async () => {

        /*
         * Development login deliberately
         * does not provide a fake token.
         */
        if (
          user?.method ===
          'development'
        ) {

          throw new Error(
            'Microsoft access token is unavailable in Expo Go development mode.'
          );

        }


        const current =
          await activeSession();


        return current.accessToken;

      },
      [
        activeSession,
        user,
      ]
    );


  // ==========================================================
  // INITIAL APPLICATION LOAD
  // ==========================================================

  useEffect(
    () => {

      /*
       * For the current POC we intentionally
       * do not restore an old authentication
       * session.
       *
       * Reloading the application therefore
       * requires login again.
       */
      setLoading(
        false
      );

    },
    []
  );


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (

    <Auth.Provider
      value={{
        isAuthenticated:
          !!user,

        isLoading,

        user,

        error,

        signIn,

        developmentSignIn,

        signOut,

        getAccessToken,
      }}
    >

      {children}

    </Auth.Provider>

  );

}


// ============================================================
// AUTH HOOK
// ============================================================

export function useAuth() {

  const context =
    useContext(
      Auth
    );


  if (!context) {

    throw new Error(
      'useAuth must be used within an AuthProvider'
    );

  }


  return context;

}


// ============================================================
// STUDENT ID FROM SWINBURNE EMAIL
// ============================================================

function studentIdFromEmail(
  email: string
): string | null {

  const match =
    email
      .toLowerCase()
      .match(
        /^(\d+)@students\.swinburne\.edu\.my$/
      );


  return (
    match?.[1] ??
    null
  );

}