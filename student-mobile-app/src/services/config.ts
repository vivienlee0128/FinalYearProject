
import Constants, {
  ExecutionEnvironment,
} from 'expo-constants';

import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

export const authConfig = {
  clientId:
    process.env.EXPO_PUBLIC_MS_CLIENT_ID ?? '',

  tenantId:
    process.env.EXPO_PUBLIC_MS_TENANT_ID ?? '',

  apiScope:
    process.env.EXPO_PUBLIC_MS_API_SCOPE ?? '',
};

export const apiBaseUrl = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? ''
).replace(/\/$/, '');

export const n8nBaseUrl = (
  process.env.EXPO_PUBLIC_N8N_URL ?? ''
).replace(/\/$/, '');

export const issuer =
  `https://login.microsoftonline.com/` +
  `${authConfig.tenantId}/v2.0`;

export const tokenEndpoint =
  `https://login.microsoftonline.com/` +
  `${authConfig.tenantId}/oauth2/v2.0/token`;

const qwicklyCheckInEnabled = Boolean(
  process.env.EXPO_PUBLIC_STUDENT_CHECKIN_API_URL?.trim()
);

export const requestStudentApiScope =
  process.env.EXPO_PUBLIC_ENABLE_STUDENT_API_SCOPE ===
  'true';

// Qwickly mode uses a Graph User.Read token.
//
// The n8n backend calls Graph /me to determine
// which student is actually signed in.
//
// Do not mix Graph and custom API scopes
// inside the same access token request.
export const scopes: string[] = [
  'openid',
  'profile',
  'email',
  'offline_access',

  ...(qwicklyCheckInEnabled
    ? ['User.Read']
    : []),

  ...(
    !qwicklyCheckInEnabled &&
    requestStudentApiScope &&
    authConfig.apiScope.trim()
      ? [authConfig.apiScope.trim()]
      : []
  ),
];

export const getRedirectUri = () =>
  makeRedirectUri({
    scheme: 'mynewapp',
    path: 'auth/callback',
  });

export function configurationError(): string | null {
  if (
    Platform.OS !== 'web' &&
    Constants.executionEnvironment ===
      ExecutionEnvironment.StoreClient
  ) {
    return (
      'Microsoft sign-in requires an Android ' +
      'development or preview build.'
    );
  }

  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    !window.isSecureContext
  ) {
    return 'Open the app on localhost or HTTPS.';
  }

  if (
    !authConfig.clientId ||
    !authConfig.tenantId
  ) {
    return 'Microsoft authentication is not configured.';
  }

  if (
    qwicklyCheckInEnabled &&
    requestStudentApiScope
  ) {
    return (
      'For Qwickly proxy mode, disable ' +
      'EXPO_PUBLIC_ENABLE_STUDENT_API_SCOPE. ' +
      'This mode uses Microsoft Graph User.Read.'
    );
  }

  if (
    requestStudentApiScope &&
    (
      !authConfig.apiScope.trim() ||
      authConfig.apiScope.includes('YOUR_')
    )
  ) {
    return (
      'The custom student API scope is ' +
      'not configured in Microsoft Entra.'
    );
  }

  return null;
}
