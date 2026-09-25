// import { AuthRequest, DiscoveryDocument, exchangeCodeAsync, fetchDiscoveryAsync, Prompt, ResponseType } from 'expo-auth-session';
// import { useRouter } from 'expo-router';
// import { useCallback, useEffect, useRef, useState } from 'react';
// import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { useAuth } from '../context/Auth';
// import { authConfig, configurationError, getRedirectUri, issuer, scopes } from '../services/config';
// import { withTimeout } from '../services/api';

// type Prepared = { request: AuthRequest; discovery: DiscoveryDocument; redirectUri: string };
// export default function Login() {
//   const router = useRouter();
//   const { signIn, error: sessionError } = useAuth();
//   const [prepared, setPrepared] = useState<Prepared | null>(null);
//   const [preparing, setPreparing] = useState(true);
//   const [busy, setBusy] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const attempt = useRef(0);
//   const inFlight = useRef(false);
//   const prepare = useCallback(async () => {
//     const version = ++attempt.current;
//     setPrepared(null); setPreparing(true); setError(null);
//     try {
//       const problem = configurationError();
//       if (problem) throw new Error(problem);
//       const redirectUri = getRedirectUri();
//       const discovery = await withTimeout(fetchDiscoveryAsync(issuer));
//       const request = new AuthRequest({ clientId: authConfig.clientId, scopes, redirectUri,
//         responseType: ResponseType.Code, usePKCE: true, prompt: Prompt.SelectAccount });
//       await withTimeout(request.makeAuthUrlAsync(discovery));
//       if (version === attempt.current) setPrepared({ request, discovery, redirectUri });
//     } catch (err) {
//       if (version === attempt.current) setError(err instanceof Error ? err.message : 'Unable to prepare Microsoft sign-in.');
//     } finally { if (version === attempt.current) setPreparing(false); }
//   }, []);
//   useEffect(() => { void prepare(); return () => { attempt.current++; }; }, [prepare]);

//   async function login() {
//     if (!prepared || inFlight.current) return;
//     inFlight.current = true; setBusy(true); setError(null);
//     let succeeded = false;
//     try {
//       // Invoke directly from the press to preserve the web browser user gesture.
//       const result = await prepared.request.promptAsync(prepared.discovery);
//       if (result.type === 'cancel' || result.type === 'dismiss') throw new Error('Sign-in was cancelled. You can try again.');
//       if (result.type === 'error') throw new Error(`Microsoft could not authorize sign-in (${result.error?.code ?? 'authorization_error'}). Contact your administrator if it continues.`);
//       if (result.type !== 'success' || !result.params.code || !prepared.request.codeVerifier) throw new Error('Microsoft did not return a valid authorization code. Please try again.');
//       const tokens = await withTimeout(exchangeCodeAsync({ clientId: authConfig.clientId,
//         code: result.params.code, redirectUri: prepared.redirectUri,
//         extraParams: { code_verifier: prepared.request.codeVerifier } }, prepared.discovery));
//       await signIn(tokens);
//       succeeded = true;
//       router.replace('/home');
//     } catch (err) {
//       setPrepared(null);
//       setError(err instanceof Error ? err.message : 'Microsoft sign-in failed. Please try again.');
//       // On native, a callback screen may now be above this retained login screen.
//       router.dismissTo('/');
//     } finally {
//       inFlight.current = false;
//       if (!succeeded) setBusy(false);
//     }
//   }
//   return <View style={styles.container}>
//     <Text style={styles.title}>Swinburne Portal</Text>
//     <Text>Sign in with your university Microsoft account.</Text>
//     {preparing && <ActivityIndicator accessibilityLabel="Preparing Microsoft sign-in" />}
//     {(error || sessionError) && <Text accessibilityRole="alert" style={styles.error}>{error || sessionError}</Text>}
//     <TouchableOpacity accessibilityRole="button" disabled={!prepared || busy} onPress={() => void login()}
//       style={[styles.button, (!prepared || busy) && styles.disabled]}>
//       <Text style={styles.buttonText}>{preparing ? 'Preparing sign-in?' : busy ? 'Signing in?' : 'Sign in with Microsoft'}</Text>
//     </TouchableOpacity>
//     {!preparing && !busy && !prepared && <TouchableOpacity accessibilityRole="button" onPress={() => void prepare()}><Text>Retry sign-in setup</Text></TouchableOpacity>}
//     {__DEV__ && prepared && <Text selectable style={styles.hint}>Registered redirect: {prepared.redirectUri}</Text>}
//   </View>;
// }
// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
//   title: { fontSize: 26, fontWeight: 'bold' }, error: { color: '#a00000' }, hint: { color: '#666', fontSize: 12 },
//   button: { padding: 16, borderRadius: 10, alignItems: 'center', backgroundColor: '#222' },
//   disabled: { opacity: 0.45 }, buttonText: { color: '#fff', fontWeight: '600' },
// });
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
import {
  exchangeCodeAsync,
  Prompt,
  ResponseType,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../context/Auth';
import {
  authConfig,
  configurationError,
  getRedirectUri,
  issuer,
  scopes,
} from '../services/config';

export default function Login() {
  const router = useRouter();
  const { signIn, error: sessionError } = useAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const configError = configurationError();

  const discovery = useAutoDiscovery(issuer);

  const redirectUri = getRedirectUri();

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: authConfig.clientId,
      scopes,
      redirectUri,

      responseType: ResponseType.Code,

      usePKCE: true,

      prompt: Prompt.SelectAccount,
    },
    discovery
  );

  useEffect(() => {
    if (!response) return;

    async function handleResponse() {
      if (response?.type === 'cancel' || response?.type === 'dismiss') {
        setBusy(false);
        setError('Sign-in was cancelled.');
        return;
      }

      if (response?.type === 'error') {
        setBusy(false);

        setError(
          `Microsoft could not authorize sign-in (${
            response.error?.code ?? 'authorization_error'
          }).`
        );

        return;
      }

      if (
        response?.type !== 'success' ||
        !response.params.code ||
        !request?.codeVerifier ||
        !discovery
      ) {
        setBusy(false);
        setError(
          'Microsoft did not return a valid authorization code.'
        );
        return;
      }

      try {
        const tokens = await exchangeCodeAsync(
          {
            clientId: authConfig.clientId,

            code: response.params.code,

            redirectUri,

            extraParams: {
              code_verifier: request.codeVerifier,
            },
          },
          discovery
        );

        await signIn(tokens);

        router.replace('/home');
      } catch (err) {
        setBusy(false);

        setError(
          err instanceof Error
            ? err.message
            : 'Microsoft sign-in failed.'
        );
      } finally {
        inFlight.current = false;
      }
    }

    void handleResponse();
  }, [response, request, discovery, redirectUri, signIn, router]);

  async function login() {
    if (
      !request ||
      !discovery ||
      busy ||
      inFlight.current ||
      configError
    ) {
      return;
    }

    try {
      inFlight.current = true;
      setBusy(true);
      setError(null);

      await promptAsync();
    } catch (err) {
      inFlight.current = false;
      setBusy(false);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to open Microsoft sign-in.'
      );
    }
  }

  const preparing = !request || !discovery;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Swinburne Portal</Text>

      <Text>
        Sign in with your university Microsoft account.
      </Text>

      {preparing && !configError && (
        <ActivityIndicator
          accessibilityLabel="Preparing Microsoft sign-in"
        />
      )}

      {(configError || error || sessionError) && (
        <Text
          accessibilityRole="alert"
          style={styles.error}
        >
          {configError || error || sessionError}
        </Text>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        disabled={
          preparing ||
          busy ||
          !!configError
        }
        onPress={() => void login()}
        style={[
          styles.button,
          (preparing || busy || !!configError) &&
            styles.disabled,
        ]}
      >
        <Text style={styles.buttonText}>
          {preparing
            ? 'Preparing sign-in...'
            : busy
              ? 'Signing in...'
              : 'Sign in with Microsoft'}
        </Text>
      </TouchableOpacity>

      {__DEV__ && (
        <Text selectable style={styles.hint}>
          Redirect URI: {redirectUri}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },

  error: {
    color: '#a00000',
  },

  hint: {
    color: '#666',
    fontSize: 12,
  },

  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#222',
  },

  disabled: {
    opacity: 0.45,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});