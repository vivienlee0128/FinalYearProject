import Constants, {
  ExecutionEnvironment,
} from "expo-constants";

import {
  makeRedirectUri,
} from "expo-auth-session";

import {
  Platform,
} from "react-native";


// ============================================
// MICROSOFT AUTH CONFIG
// ============================================

export const authConfig = {

  clientId:
    process.env.EXPO_PUBLIC_MS_CLIENT_ID ?? "",

  tenantId:
    process.env.EXPO_PUBLIC_MS_TENANT_ID ?? "",

  apiScope:
    process.env.EXPO_PUBLIC_MS_API_SCOPE ?? "",

};


// ============================================
// BACKEND
// ============================================

export const apiBaseUrl = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? ""
).replace(/\/$/, "");


// ============================================
// N8N / QWICKLY
// ============================================

export const n8nBaseUrl = (
  process.env.EXPO_PUBLIC_N8N_URL ?? ""
).replace(/\/$/, "");


// ============================================
// MICROSOFT ENDPOINTS
// ============================================

export const issuer =
  `https://login.microsoftonline.com/` +
  `${authConfig.tenantId}/v2.0`;


export const tokenEndpoint =
  `https://login.microsoftonline.com/` +
  `${authConfig.tenantId}/oauth2/v2.0/token`;


// ============================================
// MICROSOFT SCOPES
// ============================================

export const scopes = [

  "openid",

  "profile",

  "email",

  "offline_access",

  authConfig.apiScope,

].filter(Boolean);


// ============================================
// REDIRECT URI
// ============================================

export function getRedirectUri() {

  // ------------------------------------------
  // WEB
  // ------------------------------------------

  if (Platform.OS === "web") {

    return makeRedirectUri({
      path: "auth/callback",
    });

  }


  // ------------------------------------------
  // ANDROID + IOS DEVELOPMENT BUILD
  // ------------------------------------------

  return makeRedirectUri({
    scheme: "mynewapp",
    path: "auth/callback",
  });

}


// ============================================
// EXPO GO DETECTION
// ============================================

export const isExpoGo =
  Constants.executionEnvironment ===
  ExecutionEnvironment.StoreClient;


// ============================================
// CONFIGURATION CHECK
// ============================================

export function configurationError():
  string | null {

  // Expo Go cannot reliably use the custom
  // Microsoft OAuth redirect scheme.
  if (
    Platform.OS !== "web" &&
    isExpoGo
  ) {

    return (
      "Microsoft sign-in requires an iOS or " +
      "Android development build. " +
      "Expo Go is not supported."
    );

  }


  // Web Microsoft authentication requires
  // localhost or HTTPS.
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    !window.isSecureContext
  ) {

    return (
      "Open the app on localhost or HTTPS."
    );

  }


  // Check required environment variables.
  if (
    !authConfig.clientId ||
    !authConfig.tenantId ||
    !authConfig.apiScope
  ) {

    return (
      "Microsoft authentication is not configured."
    );

  }


  return null;

}