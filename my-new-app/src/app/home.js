import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/Auth";

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, signOut } = useAuth();

  // NEW: guard — if this screen is somehow reached without a
  // successful sign-in (deep link, state reset), bounce back to
  // login instead of showing anything.
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.replace("/");
  //   }
  // }, [isAuthenticated]);

  // if (!isAuthenticated) return null;

  function comingSoon() {
    Alert.alert("Coming soon", "This feature isn't built yet.");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {user?.name || "student"}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/attendance")}
      >
        <Text style={styles.buttonText}>View Attendance</Text>
      </TouchableOpacity>

      {/* NEW: placeholder buttons — replace comingSoon() with real
          navigation once each feature has its own screen. */}

      <TouchableOpacity style={styles.buttonSecondary} onPress={() => {
        router.push("/lecture");
      }}>
        <Text style={styles.buttonSecondaryText}>Scan QR</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push("/demo")}>
        <Text style={styles.buttonSecondaryText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => {
          signOut();
          router.replace("/");
        }}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  welcome: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#000000",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondary: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#eeeeee",
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  signOutText: {
    color: "#cc0000",
    fontSize: 14,
    fontWeight: "600",
  },
});