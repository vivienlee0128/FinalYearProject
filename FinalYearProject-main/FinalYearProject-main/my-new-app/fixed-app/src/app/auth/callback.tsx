import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, Platform, Text, View } from 'react-native';

// Runs before route guarding or session hydration. Native completion is owned by AuthSession.
const completion = Platform.OS === 'web' ? WebBrowser.maybeCompleteAuthSession() : null;
export default function AuthCallback() {
  const [waiting, setWaiting] = useState(true);
  useEffect(() => { const timer = setTimeout(() => setWaiting(false), 10000); return () => clearTimeout(timer); }, []);
  return <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16 }}>
    {waiting && <ActivityIndicator />}
    <Text>{completion?.type === 'failed' || !waiting
      ? 'This sign-in could not finish here. Return to the app and start a new sign-in.'
      : 'Completing Microsoft sign-in. Return to the app if this window stays open.'}</Text>
    {!waiting && <Link href="/">Return to sign-in</Link>}
  </View>;
}
