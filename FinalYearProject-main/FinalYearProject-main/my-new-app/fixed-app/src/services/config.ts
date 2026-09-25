// import Constants, { ExecutionEnvironment } from 'expo-constants';
// import { makeRedirectUri } from 'expo-auth-session';
// import { Platform } from 'react-native';

// export const authConfig = {
//   clientId: process.env.EXPO_PUBLIC_MS_CLIENT_ID ?? '',
//   tenantId: process.env.EXPO_PUBLIC_MS_TENANT_ID ?? '',
//   apiScope: process.env.EXPO_PUBLIC_MS_API_SCOPE ?? '',
// };
// export const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
// export const issuer = `https://login.microsoftonline.com/${authConfig.tenantId}/v2.0`;
// // export const tokenEndpoint = `https://login.microsoftonline.com/${authConfig.tenantId}/oauth2/v2.0/token`;
// export const scopes = ['openid', 'profile', 'email', 'offline_access', authConfig.apiScope];
// export const getRedirectUri = () => makeRedirectUri({ scheme: 'mynewapp', path: 'auth/callback' });

// export function configurationError(): string | null {
//   if (Platform.OS !== 'web' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
//     return 'Microsoft sign-in requires an Android development or preview build. Expo Go cannot use this app’s authentication redirect.';
//   }
//   if (Platform.OS === 'web' && typeof window !== 'undefined' && !window.isSecureContext) {
//     return 'Open this app using localhost or HTTPS. Microsoft sign-in cannot prepare securely over a LAN HTTP address.';
//   }
//   if (!authConfig.clientId || !authConfig.tenantId  || !apiBaseUrl) {
//     return 'Sign-in is not configured. Set the public Microsoft client ID, tenant ID, API scope and API URL in .env.local.';
//   }
//   if (!/^(api|https):\/\/[^\s]+\/[^/\s]+$/.test(authConfig.apiScope) || authConfig.apiScope.includes('YOUR_')) {
//     return 'Configure the delegated attendance API scope in .env.local (api://<API application ID>/access_as_user).';
//   }
//   try {
//     const url = new URL(apiBaseUrl);
//     if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
//     if (!__DEV__ && url.protocol !== 'https:') return 'Release builds require an HTTPS API URL.';
//   } catch { return 'The attendance API URL is invalid.'; }
//   return null;
// }

import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  makeRedirectUri,
  useAutoDiscovery,
} from 'expo-auth-session';
import { Platform } from 'react-native';

export const authConfig = {
  clientId: process.env.EXPO_PUBLIC_MS_CLIENT_ID ?? '',
  tenantId: process.env.EXPO_PUBLIC_MS_TENANT_ID ?? '',
  apiScope: process.env.EXPO_PUBLIC_MS_API_SCOPE ?? '',
};

export const apiBaseUrl =
  (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

export const issuer =
  `https://login.microsoftonline.com/${authConfig.tenantId}/v2.0`;

export const scopes = [
  'openid',
  'profile',
  'email',
  'offline_access',
  authConfig.apiScope,
];

export const getRedirectUri = () =>
  makeRedirectUri({
    scheme: 'mynewapp',
    path: 'auth/callback',
  });

export function configurationError(): string | null {
  if (
    Platform.OS !== 'web' &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return 'Microsoft sign-in requires an Android development or preview build. Expo Go cannot use this app authentication redirect.';
  }

  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    !window.isSecureContext
  ) {
    return 'Open this app using localhost or HTTPS.';
  }

  if (
    !authConfig.clientId ||
    !authConfig.tenantId ||
    !authConfig.apiScope ||
    !apiBaseUrl
  ) {
    return 'Microsoft authentication configuration is incomplete.';
  }

  return null;
}