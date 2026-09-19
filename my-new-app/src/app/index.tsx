import { exchangeCodeAsync, makeRedirectUri, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from '../context/Auth';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = '6b15c6be-f7cc-4864-bedd-2910d798fa09';
const TENANT_ID = '3f639a9b-27c8-4403-82b1-ebfb88052d15';
interface MicrosoftIdTokenClaims {
  name?: string,
  preferred_username?: string,
  email?: string,
  sub?: string,
  aud?: string,
  iss?: string,
  iat?: number,
  exp?: number,
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export default function Login(){
  const router = useRouter();
  const {signIn} = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const discovery = useAutoDiscovery(`https://login.microsoftonline.com/${TENANT_ID}/v2.0`);

  const redirectUri = makeRedirectUri();

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    console.log('Redirect URI:', redirectUri);
  }, [redirectUri]);

  useEffect(() => {
    async function handleMicrosoftResponse() {
      if (response?.type !== 'success' || !discovery) return;
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
        const claims = jwtDecode<MicrosoftIdTokenClaims>(tokenResult.idToken);

        const studentResult = await fetch (`${API_BASE_URL}/student-by-email/${claims.preferred_username}`,{
          headers: {Authorization : `Bearer ${API_KEY}`},
        });

        const studentData = studentResult.ok ? await studentResult.json():null;
        signIn({
          name: claims.name,
          email: claims.preferred_username,
          student: studentData?.student_id || null,
          method: 'microsoft',
        });
        router.replace('../home');
      } catch (error) {
        console.error('Error exchanging code for token:', error);
        Alert.alert('Authentication Error', 'Failed to authenticate with Microsoft. Please try again.');
      }
    }

    handleMicrosoftResponse();
  }, [response, discovery, redirectUri, request, router, signIn]);

  async function handleCredentialLogin() {
    console.log("LOGIN BUTTON PRESSED"); // add this
    console.log("API_BASE_URL:", API_BASE_URL);
    if (email.trim().length === 0 || password.trim().length === 0) {
      Alert.alert('Input Error', 'Please enter both email and password.');
      return;
    }

    try {
      console.log("Getting: ",`${API_BASE_URL}/login`)
      const loginResponse = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await loginResponse.text();
      console.log("Server Response status: ", loginResponse.status);
      console.log("Server body Response: ", responseText);
      if (!loginResponse.ok) {
        Alert.alert('Login Failed', 'Incorrect Credential');
        return;
      }
      const userData = JSON.parse(responseText);
      signIn({ name: userData.name, email: userData.email, student: userData.id ,method: 'credentials' });
      router.replace('/home');
    } catch (error) {
      console.error('Login Error: ', error);
      Alert.alert('Error', 'Unable to reach the Server');
    }
  }

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

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/register')}>
              <Text style={styles.registerText}>
                Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleCredentialLogin}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        );
      }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  registerLink: {
    marginTop: 16,
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: "#666666",
  },
  registerTextBold: {
    color: "#000000",
    fontWeight: "bold",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 20,
  },
  msButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#2f2f2f",
  },
  msButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#dddddd",
  },
  dividerText: {
    fontSize: 12,
    color: "#999999",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  loginButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#000000",
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

