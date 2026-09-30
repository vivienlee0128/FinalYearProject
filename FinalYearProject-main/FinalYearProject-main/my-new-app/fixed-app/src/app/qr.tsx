import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/Auth";



function showAlert(title: string, message: string, onOk?: () => void) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    onOk?.();
  } else {
    Alert.alert(title, message, onOk ? [{ text: "OK", onPress: onOk }] : undefined);
  }
}

export default function ScanQRScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const scanInFlight = useRef(false);

  // NOTE: expo-camera's QR scanning doesn't work on Expo Web —
  // only on iOS and Android (Expo Go or a dev build). On web,
  // this screen will show a "not supported" message instead.

  if (Platform.OS === "web") {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.notSupportedText}>
          QR scanning is not supported on web.{"\n"}
          Use the Android or iOS development build to scan QR codes.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" />
    </View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.permissionText}>
          Camera permission is needed to scan QR codes.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleBarCodeScanned({
  data,
}: {
  data: string;
}) {
  if (
    scanned ||
    scanInFlight.current
  ) {
    return;
  }

  scanInFlight.current = true;
  setScanned(true);

  console.log(
    '[QR] Scanned payload:',
    data
  );

  showAlert(
    'QR Code Scanned',
    `QR payload:\n\n${data}`,
    () => setScanned(false)
  );

  scanInFlight.current = false;
}

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      <View style={styles.overlay}>
        <View style={styles.scanBox} />
        <Text style={styles.hint}>
          {loading ? "Recording attendance..." : "Point your camera at the lecturer's QR code"}
        </Text>

        {scanned && !loading && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.buttonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scanBox: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: "#ffffff",
    borderRadius: 12,
    position: "absolute",
    top: -260,
    alignSelf: "center",
  },
  hint: {
    color: "#ffffff",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  permissionText: {
    fontSize: 14,
    textAlign: "center",
    color: "#444444",
  },
  notSupportedText: {
    fontSize: 14,
    textAlign: "center",
    color: "#444444",
    lineHeight: 22,
  },
});