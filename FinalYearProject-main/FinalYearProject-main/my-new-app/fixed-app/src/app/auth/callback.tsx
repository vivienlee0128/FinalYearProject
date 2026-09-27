import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

// Required on web so the popup can hand the OAuth result back to the opener.
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  return (
    <View style={styles.container}>
      <ActivityIndicator />
      <Text>Completing Microsoft sign-in...</Text>
      <Text style={styles.hint}>
        If this window does not close automatically, return to the original app tab.
      </Text>
      <Link href="/">Return to sign-in</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  hint: { color: '#666', textAlign: 'center' },
});
