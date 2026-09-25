import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/Auth';

function Navigation() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="Restoring session" /></View>;
  return <Stack>
    <Stack.Protected guard={!isAuthenticated}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'University account' }} />
    </Stack.Protected>
    <Stack.Protected guard={isAuthenticated}>
      <Stack.Screen name="home" options={{ title: 'Swinburne Portal' }} />
      <Stack.Screen name="explore" options={{ title: 'Help' }} />
      <Stack.Protected guard={user?.role === 'student'}>
        <Stack.Screen name="qr" options={{ title: 'Scan attendance QR' }} />
        <Stack.Screen name="attendance" options={{ title: 'My attendance' }} />
        <Stack.Screen name="attendancess" options={{ title: 'My attendance' }} />
      </Stack.Protected>
      <Stack.Protected guard={user?.role === 'lecturer'}>
        <Stack.Screen name="lecture" options={{ title: 'Lecturer portal' }} />
        <Stack.Screen name="demo" options={{ title: 'Student records' }} />
      </Stack.Protected>
    </Stack.Protected>
    <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
  </Stack>;
}
export default function RootLayout() { return <AuthProvider><Navigation /></AuthProvider>; }
