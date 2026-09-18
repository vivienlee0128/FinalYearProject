import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

// Hardcoded for demo — in production this would come from the
// lecturer's enrolled units pulled from your database.
const DEMO_UNITS = [
  { code: "COS20031", name: "Database" },
  { code: "COS20032", name: "Programming" },
  { code: "COS20033", name: "Computer Systems" },
];

function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function LecturerQRScreen() {
  const [selectedUnit, setSelectedUnit] = useState(DEMO_UNITS[0].code);
  const [duration, setDuration] = useState(15);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateQR() {
    setLoading(true);
    setSessionToken(null);

    try {
      const res = await fetch(`${API_BASE_URL}/sessions/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unit_code: selectedUnit,
          duration_minutes: duration,
        }),
      });

      if (!res.ok) {
        showAlert("Error", "Failed to generate QR code.");
        return;
      }

      const data = await res.json();
      setSessionToken(data.session_token);
      setExpiresAt(new Date(data.expires_at));
    } catch (err) {
      console.error(err);
      showAlert("Error", "Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const unitName = DEMO_UNITS.find((u) => u.code === selectedUnit)?.name;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Generate Attendance QR</Text>

      {/* Unit selector */}
      <Text style={styles.label}>Select Unit</Text>
      <View style={styles.unitRow}>
        {DEMO_UNITS.map((u) => (
          <TouchableOpacity
            key={u.code}
            style={[
              styles.unitButton,
              selectedUnit === u.code && styles.unitButtonActive,
            ]}
            onPress={() => setSelectedUnit(u.code)}
          >
            <Text
              style={[
                styles.unitButtonText,
                selectedUnit === u.code && styles.unitButtonTextActive,
              ]}
            >
              {u.code}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Duration selector */}
      <Text style={styles.label}>QR Valid For</Text>
      <View style={styles.unitRow}>
        {[5, 10, 15, 30].map((min) => (
          <TouchableOpacity
            key={min}
            style={[
              styles.unitButton,
              duration === min && styles.unitButtonActive,
            ]}
            onPress={() => setDuration(min)}
          >
            <Text
              style={[
                styles.unitButtonText,
                duration === min && styles.unitButtonTextActive,
              ]}
            >
              {min}m
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.generateButton}
        onPress={generateQR}
        disabled={loading}
      >
        <Text style={styles.generateButtonText}>
          {loading ? "Generating..." : "Generate QR"}
        </Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {sessionToken && (
        <View style={styles.qrContainer}>
          <Text style={styles.qrUnit}>{unitName}</Text>
          <QRCode value={sessionToken} size={250} />
          <Text style={styles.qrExpiry}>
            Expires at:{" "}
            {expiresAt?.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <Text style={styles.qrHint}>
            Show this to students to scan for attendance
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 40,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444444",
  },
  unitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#eeeeee",
  },
  unitButtonActive: {
    backgroundColor: "#000000",
  },
  unitButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  unitButtonTextActive: {
    color: "#ffffff",
  },
  generateButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#000000",
  },
  generateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  qrContainer: {
    marginTop: 24,
    alignItems: "center",
    gap: 12,
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
  },
  qrUnit: {
    fontSize: 18,
    fontWeight: "bold",
  },
  qrExpiry: {
    fontSize: 14,
    color: "#666666",
  },
  qrHint: {
    fontSize: 12,
    color: "#999999",
    textAlign: "center",
  },
});