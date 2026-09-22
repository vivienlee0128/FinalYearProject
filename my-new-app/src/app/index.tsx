// import { exchangeCodeAsync, makeRedirectUri, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import * as WebBrowser from 'expo-web-browser';
// import { jwtDecode } from 'jwt-decode';
// import { useEffect, useState } from 'react';
// import {
//   Alert,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// import { useAuth } from '../context/Auth';

// WebBrowser.maybeCompleteAuthSession();

// const CLIENT_ID = process.env.EXPO_PUBLIC_MS_CLIENT_ID;
// const TENANT_ID = 'organisation';
// interface MicrosoftIdTokenClaims {
//   name?: string,
//   preferred_username?: string,
//   email?: string,
//   sub?: string,
//   aud?: string,
//   iss?: string,
//   iat?: number,
//   exp?: number,
// }

// const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
// const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

// export default function Login(){
//   const router = useRouter();
//   const {signIn} = useAuth();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const discovery = useAutoDiscovery(`https://login.microsoftonline.com/${TENANT_ID}/v2.0`);
//   // const {studentID} = useLocalSearchParams;

//   const redirectUri = makeRedirectUri();

//   const [request, response, promptAsync] = useAuthRequest(
//     {
//       clientId: CLIENT_ID,
//       scopes: ['openid', 'profile', 'email', 'offline_access'],
//       redirectUri,
//     },
//     discovery
//   );

//   useEffect(() => {
//     console.log('Redirect URI:', redirectUri);
//   }, [redirectUri]);

//   useEffect(() => {
//     async function handleMicrosoftResponse() {
//       if (response?.type !== 'success' || !discovery) return;
//       try {
//         const tokenResult = await exchangeCodeAsync(
//           {
//             clientId: CLIENT_ID,
//             code: response.params.code,
//             extraParams: { code_verifier: request?.codeVerifier || '' },
//             redirectUri,
//           },
//           discovery
//         );
//         if (!tokenResult.idToken) {
//           throw new Error('No ID token received from Microsoft.');
//         }
//         const claims = jwtDecode<MicrosoftIdTokenClaims>(tokenResult.idToken);

//         const studentResult = await fetch (`${API_BASE_URL}/student-by-email/${claims.preferred_username}`,{
//           headers: {Authorization : `Bearer ${API_KEY}`},
//         });

//         const studentData = studentResult.ok ? await studentResult.json():null;
//         signIn({
//           name: claims.name,
//           email: claims.preferred_username,
//           student: studentData?.student_id || null,
//           method: 'microsoft',
//         });
//         router.replace('../home');
//       } catch (error) {
//         console.error('Error exchanging code for token:', error);
//         Alert.alert('Authentication Error', 'Failed to authenticate with Microsoft. Please try again.');
//       }
//     }

//     handleMicrosoftResponse();
//   }, [response, discovery, redirectUri, request, router, signIn]);

//   async function handleCredentialLogin() {
//     console.log("LOGIN BUTTON PRESSED"); // add this
//     console.log("API_BASE_URL:", API_BASE_URL);
//     if (email.trim().length === 0 || password.trim().length === 0) {
//       Alert.alert('Input Error', 'Please enter both email and password.');
//       return;
//     }

//     try {
//       console.log("Getting: ",`${API_BASE_URL}/login`)
//       const loginResponse = await fetch(`${API_BASE_URL}/login`, {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${API_KEY}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, password }),
//       });

//       const responseText = await loginResponse.text();
//       console.log("Server Response status: ", loginResponse.status);
//       console.log("Server body Response: ", responseText);
//       if (!loginResponse.ok) {
//         Alert.alert('Login Failed', 'Incorrect Credential');
//         return;
//       }
//       const userData = JSON.parse(responseText);
//       signIn({ name: userData.name, email: userData.email, student: userData.id ,method: 'credentials' });
//       router.replace('/home');
//     } catch (error) {
//       console.error('Login Error: ', error);
//       Alert.alert('Error', 'Unable to reach the Server');
//     }
//   }

//   return (
//           <View style={styles.container}>
//             <Text style={styles.title}>Swinburne Student Portal</Text>
//             <Text style={styles.subtitle}>Sign in to continue</Text>

//             <TouchableOpacity
//               style={styles.msButton}
//               disabled={!request}
//               onPress={() => promptAsync()}
//             >
//               <Text style={styles.msButtonText}>Sign in with Microsoft</Text>
//             </TouchableOpacity>

//             <View style={styles.divider}>
//               <View style={styles.dividerLine} />
//               <Text style={styles.dividerText}>or</Text>
//               <View style={styles.dividerLine} />
//             </View>

//             <TextInput
//               style={styles.input}
//               placeholder="Email"
//               value={email}
//               onChangeText={setEmail}
//               autoCapitalize="none"
//               autoCorrect={false}
//               keyboardType="email-address"
//             />

//             <TextInput
//               style={styles.input}
//               placeholder="Password"
//               value={password}
//               onChangeText={setPassword}
//               secureTextEntry
//             />

//             <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/register')}>
//               <Text style={styles.registerText}>
//                 Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.loginButton}
//               onPress={handleCredentialLogin}
//             >
//               <Text style={styles.loginButtonText}>Log In</Text>
//             </TouchableOpacity>
//           </View>
//         );
//       }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     padding: 24,
//     gap: 12,
//   },
//   registerLink: {
//     marginTop: 16,
//     alignItems: "center",
//   },
//   registerText: {
//     fontSize: 14,
//     color: "#666666",
//   },
//   registerTextBold: {
//     color: "#000000",
//     fontWeight: "bold",
//   },

//   title: {
//     fontSize: 26,
//     fontWeight: "bold",
//     textAlign: "center",
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#666666",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   msButton: {
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: "center",
//     backgroundColor: "#2f2f2f",
//   },
//   msButtonText: {
//     color: "#ffffff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   divider: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 16,
//     gap: 10,
//   },
//   dividerLine: {
//     flex: 1,
//     height: 1,
//     backgroundColor: "#dddddd",
//   },
//   dividerText: {
//     fontSize: 12,
//     color: "#999999",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#cccccc",
//     borderRadius: 8,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     fontSize: 14,
//   },
//   loginButton: {
//     marginTop: 8,
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: "center",
//     backgroundColor: "#000000",
//   },
//   loginButtonText: {
//     color: "#ffffff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });

//Version 2

// import { exchangeCodeAsync, makeRedirectUri, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import * as WebBrowser from 'expo-web-browser';
// import { jwtDecode } from 'jwt-decode';
// import { useEffect } from 'react';
// import {
//   Alert,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// import { useAuth } from '../context/Auth';

// WebBrowser.maybeCompleteAuthSession();

// const CLIENT_ID = process.env.EXPO_PUBLIC_MS_CLIENT_ID;
// // Note: Double-check if your Entra ID tenant is actually 'organizations' (with an 's') or a specific Tenant ID string.
// const TENANT_ID = 'organizations'; 

// interface MicrosoftIdTokenClaims {
//   name?: string,
//   preferred_username?: string,
//   email?: string,
//   sub?: string,
//   aud?: string,
//   iss?: string,
//   iat?: number,
//   exp?: number,
// }

// export default function Login(){
//   const router = useRouter();
//   const { signIn } = useAuth();
  
//   // 1. Capture the studentID from the URL parameter (e.g., ?studentID=12345678)
//   const { studentID } = useLocalSearchParams();

//   const discovery = useAutoDiscovery(`https://login.microsoftonline.com/${TENANT_ID}/v2.0`);
//   const redirectUri = makeRedirectUri({
//     path : 'api/auth/callback'
//   });

//   const [request, response, promptAsync] = useAuthRequest(
//     {
//       clientId: CLIENT_ID!,
//       scopes: ['openid', 'profile', 'email', 'offline_access'],
//       redirectUri,
//     },
//     discovery
//   );

//   useEffect(() => {
//     async function handleMicrosoftResponse() {
//       if (response?.type !== 'success' || !discovery) return;
//       try {
//         const tokenResult = await exchangeCodeAsync(
//           {
//             clientId: CLIENT_ID!,
//             code: response.params.code,
//             extraParams: { code_verifier: request?.codeVerifier || '' },
//             redirectUri,
//           },
//           discovery
//         );
        
//         if (!tokenResult.idToken) {
//           throw new Error('No ID token received from Microsoft.');
//         }
        
//         const claims = jwtDecode<MicrosoftIdTokenClaims>(tokenResult.idToken);

//         // 2. Sign in the Lecturer/Admin (Removed the custom backend fetch logic)
//         signIn({
//           name: claims.name,
//           email: claims.preferred_username || claims.email,
//           method: 'microsoft',
//         });

//         // 3. Navigate to home, passing the studentID along so the next screen can query Qwickly
//         if (studentID) {
//           router.replace({ pathname: '/home', params: { studentID } });
//         } else {
//           router.replace('/home');
//         }

//       } catch (error) {
//         console.error('Error exchanging code for token:', error);
//         Alert.alert('Authentication Error', 'Failed to authenticate with Microsoft. Please try again.');
//       }
//     }

//     handleMicrosoftResponse();
//   }, [response, discovery, redirectUri, request, router, signIn, studentID]);

//   return (
//     <View style={styles.container}>
//       {/* Updated UI for Staff/Admin context */}
//       <Text style={styles.title}>Smart Attendance System</Text>
//       <Text style={styles.subtitle}>Staff & Admin Portal</Text>

//       <TouchableOpacity
//         style={styles.msButton}
//         disabled={!request}
//         onPress={() => promptAsync()}
//       >
//         <Text style={styles.msButtonText}>Sign in with Microsoft</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     padding: 24,
//     gap: 12,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "bold",
//     textAlign: "center",
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#666666",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   msButton: {
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: "center",
//     backgroundColor: "#2f2f2f",
//   },
//   msButtonText: {
//     color: "#ffffff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });

//Version 3

import { makeRedirectUri, useAuthRequest, useAutoDiscovery, ResponseType } from 'expo-auth-session';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { jwtDecode } from 'jwt-decode';
import { useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from '../context/Auth';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_MS_CLIENT_ID || "";
const TENANT_ID = 'organizations';

interface MicrosoftIdTokenClaims {
  name?: string;
  preferred_username?: string;
  email?: string;
}

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { studentID } = useLocalSearchParams();

  const discovery = useAutoDiscovery(`https://login.microsoftonline.com/${TENANT_ID}/v2.0`);
  
  const redirectUri = makeRedirectUri({
    path: 'api/auth/callback'
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      // Removed 'offline_access' as it requires the code exchange flow
      scopes: ['openid', 'profile', 'email'], 
      redirectUri,
      // Change 1: Explicitly request the Token directly instead of a code
      responseType: ResponseType.IdToken, 
      extraParams: {
        nonce: 'defaultNonce', // Change 2: Nonce is required by Microsoft for Implicit Flow
      }
    },
    discovery
  );

  useEffect(() => {
    // Change 3: We no longer use handleMicrosoftResponse() or exchangeCodeAsync.
    // The token is delivered immediately in the response object.
    if (response?.type === 'success') {
      try {
        const idToken = response.params.id_token;
        
        if (!idToken) {
          throw new Error('No ID token received from Microsoft.');
        }
        
        const claims = jwtDecode<MicrosoftIdTokenClaims>(idToken);

        signIn({
          name: claims.name,
          email: claims.preferred_username || claims.email,
          method: 'microsoft',
        });

        if (studentID) {
          router.replace({ pathname: '/home', params: { studentID } }as any);
        } else {
          router.replace('/home' as any);
        }

      } catch (error) {
        console.error('Error parsing implicit token:', error);
        Alert.alert('Authentication Error', 'Failed to process Microsoft login.');
      }
    } else if (response?.type === 'error') {
      Alert.alert('Login Error', response.error?.message || 'Something went wrong.');
    }
  }, [response, router, signIn, studentID]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Attendance System</Text>
      <Text style={styles.subtitle}>Staff & Admin Portal</Text>

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