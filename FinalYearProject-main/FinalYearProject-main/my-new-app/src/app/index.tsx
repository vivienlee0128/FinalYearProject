import { exchangeCodeAsync, makeRedirectUri, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from '../context/Auth';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = '6b15c6be-f7cc-4864-bedd-2910d798fa09';
const TENANT_ID = '3f639a9b-27c8-4403-82b1-ebfb88052d15';

interface MicrosoftIdTokenClaims {
  name?: string;
  preferred_username?: string;
  email?: string;
  sub?: string;
  aud?: string;
  iss?: string;
  iat?: number;
  exp?: number;
}

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  
  const discovery = useAutoDiscovery(`https://login.microsoftonline.com/${TENANT_ID}/v2.0`);
  const redirectUri = makeRedirectUri();
  const hasExchanged = useRef(false);
  
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    async function handleMicrosoftResponse() {
      if (response?.type !== 'success' || !discovery) return;
      if (hasExchanged.current) return;
      hasExchanged.current = true;
      
      try {
        const tokenResult = await exchangeCodeAsync(
          {
            clientId: CLIENT_ID,
            code: response.params.code,
            extraParams: { code_verifier: request?.codeVerifier || '' },
            redirectUri,
          },
          discovery
        );
        
        if (!tokenResult.idToken) {
          throw new Error('No ID token received from Microsoft.');
        }
        
        // 1. Decode Microsoft's token
        const claims = jwtDecode<MicrosoftIdTokenClaims>(tokenResult.idToken);

        // 2. Sign the user in locally using strictly Microsoft's data (No PostgreSQL fetch)
        signIn({
          name: claims.name,
          email: claims.preferred_username,
          student: claims.sub, // Using Microsoft's unique ID ('sub') as the fallback ID
          method: 'microsoft',
        });
        
        // 3. Puff - redirect to main page
        router.replace('/home');
        
      } catch (error) {
        console.error('Error exchanging code for token:', error);
        Alert.alert('Authentication Error', 'Failed to authenticate with Microsoft. Please try again.');
        hasExchanged.current = false; // Reset so they can try again if it fails
      }
    }

    handleMicrosoftResponse();
  }, [response, discovery, redirectUri, request, router, signIn]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Swinburne Student Portal</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TouchableOpacity
        style={styles.msButton}
        disabled={!request}
        onPress={() => promptAsync()}
      >
        <Text style={styles.msButtonText}>Sign in with Microsoft</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#666666", textAlign: "center", marginBottom: 20 },
  msButton: { paddingVertical: 14, borderRadius: 10, alignItems: "center", backgroundColor: "#2f2f2f" },
  msButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});