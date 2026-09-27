import {
  exchangeCodeAsync,
  Prompt,
  ResponseType,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../context/Auth';
import {
  authConfig,
  configurationError,
  getRedirectUri,
  issuer,
  scopes,
} from '../services/config';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const { signIn, error: sessionError } = useAuth();
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const configError = configurationError();
  const discovery = useAutoDiscovery(issuer);
  const redirectUri = getRedirectUri();

  const [request, , promptAsync] = useAuthRequest(
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

  const preparing = !configError && (!discovery || !request);

  async function login() {
    if (configError || !discovery || !request || busy || inFlight.current) return;

    inFlight.current = true;
    setBusy(true);
    setLoginError(null);

    try {
      const result = await promptAsync();

      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('Sign-in was cancelled. You can try again.');
      }

      if (result.type === 'error') {
        throw new Error(
          `Microsoft could not authorize sign-in (${result.error?.code ?? 'authorization_error'}).`
        );
      }

      if (result.type !== 'success' || !result.params.code || !request.codeVerifier) {
        throw new Error('Microsoft did not return a valid authorization code.');
      }

      const tokens = await exchangeCodeAsync(
        {
          clientId: authConfig.clientId,
          code: result.params.code,
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
      setLoginError(err instanceof Error ? err.message : 'Microsoft sign-in failed.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Swinburne Portal</Text>
      <Text>Sign in with your university Microsoft account.</Text>

      {preparing && <ActivityIndicator accessibilityLabel="Preparing Microsoft sign-in" />}

      {configError && (
        <Text accessibilityRole="alert" style={styles.error}>
          CONFIG: {configError}
        </Text>
      )}

      {loginError && (
        <Text accessibilityRole="alert" style={styles.error}>
          MICROSOFT: {loginError}
        </Text>
      )}

      {sessionError && (
        <Text accessibilityRole="alert" style={styles.error}>
          SESSION: {sessionError}
        </Text>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        disabled={!!configError || preparing || busy}
        onPress={() => void login()}
        style={[styles.button, (!!configError || preparing || busy) && styles.disabled]}
      >
        <Text style={styles.buttonText}>
          {preparing ? 'Preparing sign-in...' : busy ? 'Signing in...' : 'Sign in with Microsoft'}
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
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 26, fontWeight: 'bold' },
  error: { color: '#a00000' },
  hint: { color: '#666', fontSize: 12 },
  button: { padding: 16, borderRadius: 10, alignItems: 'center', backgroundColor: '#222' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
