
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import FirstRunGate from '../components/FirstRunGate';

import {
  AuthProvider,
  useAuth,
} from '../context/Auth';

function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator
          size="large"
          accessibilityLabel="Loading"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        {/* NOT LOGGED IN */}
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen
            name="index"
            options={{ headerShown: false }}
          />
        </Stack.Protected>

        {/* LOGGED IN STUDENT */}
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen
            name="home"
            options={{ title: 'Student Portal' }}
          />

          <Stack.Screen
            name="first-time-guide"
            options={{ title: 'How to Use the App' }}
          />

          <Stack.Screen
            name="attendance"
            options={{ title: 'My Attendance' }}
          />

          <Stack.Screen
            name="qr"
            options={{ title: 'Scan Attendance QR' }}
          />

          <Stack.Screen
            name="visa"
            options={{ title: 'Visa & Compliance' }}
          />

          <Stack.Screen
            name="scan"
            options={{ title: 'Scan QR Code' }}
          />

          <Stack.Screen
            name="attendance-report"
            options={{ title: 'Attendance Report' }}
          />
        </Stack.Protected>

        {/* MICROSOFT SSO CALLBACK */}
        <Stack.Screen
          name="auth/callback"
          options={{ headerShown: false }}
        />
      </Stack>

      {/* Gate must be outside the Stack */}
      {isAuthenticated && <FirstRunGate />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
