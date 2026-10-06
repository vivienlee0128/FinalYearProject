import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrType, setQrType] = useState<string | null>(null);

  // ---------------------------------------------------------
  // Waiting for camera permission information
  // ---------------------------------------------------------
  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.message}>
          Checking camera permission...
        </Text>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------
  // Camera permission not granted
  // ---------------------------------------------------------
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>
          Camera Permission Required
        </Text>

        <Text style={styles.message}>
          Camera access is required to scan the attendance QR code.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>
            Allow Camera
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------
  // QR successfully scanned
  // ---------------------------------------------------------
  const handleBarcodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    // Prevent multiple scans
    if (scanned) return;

    setScanned(true);
    setQrData(data);
    setQrType(type);

    console.log('================================');
    console.log('[QR] QR CODE SCANNED');
    console.log('[QR] Type:', type);
    console.log('[QR] Length:', data.length);
    console.log('[QR] Raw payload:');
    console.log(data);
    console.log('================================');
  };

  // ---------------------------------------------------------
  // Reset scanner
  // ---------------------------------------------------------
  const scanAgain = () => {
    setScanned(false);
    setQrData(null);
    setQrType(null);
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Scan Attendance
        </Text>

        <Text style={styles.headerSubtitle}>
          Scan the QR code displayed by your lecturer
        </Text>
      </View>

      {/* Scanner */}
      {!scanned && (
        <View style={styles.cameraContainer}>

          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />

          {/* QR target box */}
          <View style={styles.overlay}>
            <View style={styles.scanBox} />
          </View>

        </View>
      )}

      {/* Result */}
      {scanned && (
        <ScrollView
          style={styles.resultContainer}
          contentContainerStyle={styles.resultContent}
        >
          <Text style={styles.success}>
            QR Code Scanned
          </Text>

          <Text style={styles.label}>
            QR Type
          </Text>

          <View style={styles.dataBox}>
            <Text selectable style={styles.data}>
              {qrType}
            </Text>
          </View>

          <Text style={styles.label}>
            Payload Length
          </Text>

          <View style={styles.dataBox}>
            <Text selectable style={styles.data}>
              {qrData?.length ?? 0} characters
            </Text>
          </View>

          <Text style={styles.label}>
            Raw QR Payload
          </Text>

          <View style={styles.payloadBox}>
            <Text selectable style={styles.payload}>
              {qrData}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={scanAgain}
          >
            <Text style={styles.buttonText}>
              Scan Another QR
            </Text>
          </TouchableOpacity>

        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },

  headerSubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#6b7280',
  },

  cameraContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },

  camera: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
    textAlign: 'center',
  },

  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 25,
  },

  button: {
    backgroundColor: '#e31b23',
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  resultContainer: {
    flex: 1,
  },

  resultContent: {
    padding: 24,
  },

  success: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 25,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 15,
    marginBottom: 8,
  },

  dataBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 15,
  },

  data: {
    fontSize: 15,
    color: '#111827',
  },

  payloadBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 15,
    minHeight: 150,
  },

  payload: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
});