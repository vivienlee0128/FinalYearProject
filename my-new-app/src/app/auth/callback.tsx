import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function AuthCallback() {
  useEffect(() => {
    // This function captures the URL parameters (like the auth code) 
    // from Microsoft, sends them back to your index.tsx window, and closes this popup.
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.text}>Completing authentication, please wait...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#333333",
  }
});