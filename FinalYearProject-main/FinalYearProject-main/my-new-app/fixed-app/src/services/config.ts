import Constants, {
  ExecutionEnvironment,
} from "expo-constants";

import { makeRedirectUri } from "expo-auth-session";
import { Platform } from "react-native";

export const authConfig = {
  clientId:
    process.env.EXPO_PUBLIC_MS_CLIENT_ID ?? "",

  tenantId:
    process.env.EXPO_PUBLIC_MS_TENANT_ID ?? "",

  apiScope:
    process.env.EXPO_PUBLIC_MS_API_SCOPE ?? "",
};

// Your existing backend
export const apiBaseUrl = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? ""
).replace(/\/$/, "");

// n8n / Qwickly middleware
export const n8nBaseUrl = (
  process.env.EXPO_PUBLIC_N8N_URL ?? ""
).replace(/\/$/, "");

export const issuer =
  `https://login.microsoftonline.com/` +
  `${authConfig.tenantId}/v2.0`;

export const tokenEndpoint =
  `https://login.microsoftonline.com/` +
  `${authConfig.tenantId}/oauth2/v2.0/token`;

export const scopes = [
  "openid",
  "profile",
  "email",
  "offline_access",
  authConfig.apiScope,
].filter(Boolean);

export const getRedirectUri = () =>
  makeRedirectUri({
    scheme: "mynewapp",
    path: "auth/callback",
  });

export function configurationError(): string | null {

  if (
    Platform.OS !== "web" &&
    Constants.executionEnvironment ===
      ExecutionEnvironment.StoreClient
  ) {
    return (
      "Microsoft sign-in requires an Android " +
      "development or preview build."
    );
  }

  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    !window.isSecureContext
  ) {
    return (
      "Open the app on localhost or HTTPS."
    );
  }

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