import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, Linking } from "react-native";
import { useAuth } from "../context/Auth";
import { useEffect } from "react";

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, signOut } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  // Use your computer's local IP address so it works on a physical phone
  const N8N_BASE_URL = "http://10.126.70.211:5678/webhook";

  function generateVisaReport() {
    // Assuming the user's student ID is stored in the auth context
    const studentId = user?.student || "14744"; 
    const url = `${N8N_BASE_URL}/visa-compliance?sis_id=${studentId}`;
    Linking.openURL(url);
  }

  function exportAttendanceExcel() {
    // Hardcoded course ID for the POC
    const courseId = "101"; 
    const url = `${N8N_BASE_URL}/export-attendance?course_id=${courseId}`;
    Linking.openURL(url);
  }

  return (
    <View style={styles.container}>
      {/* Changed fallback from Admin to Student since this is a student portal */}
      <Text style={styles.welcome}>Welcome, {user?.name || "Student"}</Text>

      {/* Standard App Features */}
      {/* This automatically links to app/attendance.tsx */}
      <TouchableOpacity style={styles.button} onPress={() => router.push("/attendance")}>
        <Text style={styles.buttonText}>Official Attendance Letter</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push("/lecture")}>
        <Text style={styles.buttonSecondaryText}>Scan QR Code</Text>
      </TouchableOpacity>

      {/* Phase 2: n8n Compliance POC Buttons */}
      <View style={styles.pocContainer}>
        <Text style={styles.pocTitle}>Phase 2: Compliance Tools</Text>
        
        <TouchableOpacity style={styles.pocButton} onPress={generateVisaReport}>
          <Text style={styles.buttonText}>Generate Visa Report (PDF)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pocButton} onPress={exportAttendanceExcel}>
          <Text style={styles.buttonText}>Export Class Roster (.xlsx)</Text>
        </TouchableOpacity>
      </View>

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
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 12 },
  welcome: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  button: { width: "100%", paddingVertical: 14, borderRadius: 10, alignItems: "center", backgroundColor: "#000000" },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  buttonSecondary: { width: "100%", paddingVertical: 14, borderRadius: 10, alignItems: "center", backgroundColor: "#eeeeee" },
  buttonSecondaryText: { fontSize: 16, fontWeight: "600" },
  
  // POC specific styles
  pocContainer: { width: "100%", marginTop: 20, padding: 16, backgroundColor: "#f8f9fa", borderRadius: 10, borderWidth: 1, borderColor: "#dee2e6" },
  pocTitle: { fontSize: 14, fontWeight: "bold", color: "#495057", marginBottom: 12, textAlign: "center", textTransform: "uppercase" },
  pocButton: { width: "100%", paddingVertical: 12, borderRadius: 8, alignItems: "center", backgroundColor: "#b30000", marginBottom: 8 },
  
  signOutButton: { marginTop: 20, paddingVertical: 10 },
  signOutText: { color: "#cc0000", fontSize: 14, fontWeight: "600" },
});