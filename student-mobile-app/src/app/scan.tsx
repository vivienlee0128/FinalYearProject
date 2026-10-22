import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/Auth';
import { submitDemoQrAttendance, type DemoQrResult } from '../services/qrAttendanceAPI';

type ScanOutcome = { kind: 'success' | 'error'; message: string; details?: DemoQrResult };

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { user } = useAuth();
  const locked = useRef(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);

  async function handleBarcodeScanned({ type, data }: { type: string; data: string }) {
    if (locked.current || type !== 'qr') return;
    locked.current = true;
    setScanned(true);
    setProcessing(true);
    setOutcome(null);

    try {
      if (!user || user.method !== 'microsoft' || !user.sisId) {
        throw new Error('Sign in using your university Microsoft account before scanning attendance.');
      }
      const result = await submitDemoQrAttendance(data, user.sisId);
      setOutcome({ kind: result.ok ? 'success' : 'error', message: result.message, details: result });
    } catch (error) {
      setOutcome({
        kind: 'error',
        message: error instanceof Error ? error.message : 'QR verification failed.',
      });
    } finally {
      setProcessing(false);
    }
  }

  function scanAgain() {
    setOutcome(null);
    setScanned(false);
    setProcessing(false);
    locked.current = false;
  }

  if (!permission) {
    return <SafeAreaView style={styles.center}><ActivityIndicator /><Text style={styles.message}>Checking camera permission...</Text></SafeAreaView>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.message}>Camera access is needed to scan a lecturer's attendance QR code.</Text>
        <TouchableOpacity style={styles.button} onPress={() => void requestPermission()}>
          <Text style={styles.buttonText}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Attendance</Text>
        <Text style={styles.headerSubtitle}>Scan a QR code issued for an active demo class session.</Text>
        <Text style={styles.warning}>FYP DEMO ONLY — This does not submit attendance to Qwickly.</Text>
        <Text style={styles.identity}>Signed-in SIS ID: {user?.sisId ?? 'Unavailable'}</Text>
      </View>

      {!scanned ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={(event) => void handleBarcodeScanned(event)}
          />
          <View pointerEvents="none" style={styles.overlay}>
            <View style={styles.scanBox} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.resultContent}>
          {processing ? (
            <View style={styles.resultCard}>
              <ActivityIndicator size="large" color="#8B1E2D" />
              <Text style={styles.resultTitle}>Checking QR session...</Text>
              <Text style={styles.message}>Validating the demo session with n8n.</Text>
            </View>
          ) : (
            <View style={styles.resultCard}>
              <Text style={[styles.resultTitle, outcome?.kind === 'success' ? styles.success : styles.error]}>
                {outcome?.kind === 'success' ? 'Demo attendance accepted' : 'Attendance not accepted'}
              </Text>
              <Text style={styles.message}>{outcome?.message ?? 'No response available.'}</Text>
              {outcome?.details?.courseCode ? (
                <Text style={styles.detail}>Unit: {outcome.details.courseCode}</Text>
              ) : null}
              {outcome?.details?.sessionId ? (
                <Text style={styles.detail}>Session: {outcome.details.sessionId}</Text>
              ) : null}
              <Text style={styles.disclaimer}>Not an official attendance confirmation. No Qwickly record was created.</Text>
              <TouchableOpacity style={styles.button} onPress={scanAgain}>
                <Text style={styles.buttonText}>Scan Another QR</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 18 },
  headerTitle: { fontSize: 27, fontWeight: '700', color: '#111827' },
  headerSubtitle: { marginTop: 6, fontSize: 14, color: '#6b7280', lineHeight: 20 },
  warning: { marginTop: 15, backgroundColor: '#fff2cf', color: '#805b12', padding: 12, borderRadius: 9, lineHeight: 19 },
  identity: { marginTop: 12, fontSize: 13, color: '#64748b' },
  cameraContainer: { flex: 1, marginHorizontal: 20, marginBottom: 20, borderRadius: 18, overflow: 'hidden', backgroundColor: '#111827' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: 240, height: 240, borderWidth: 3, borderColor: '#fff', borderRadius: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111827', textAlign: 'center' },
  message: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginTop: 12, textAlign: 'center' },
  resultContent: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  resultCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center' },
  resultTitle: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center', marginTop: 8 },
  success: { color: '#166534' },
  error: { color: '#b91c1c' },
  detail: { marginTop: 12, color: '#374151', fontSize: 14 },
  disclaimer: { marginTop: 18, color: '#805b12', backgroundColor: '#fff2cf', padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  button: { backgroundColor: '#8B1E2D', paddingVertical: 15, paddingHorizontal: 28, borderRadius: 10, alignItems: 'center', marginTop: 22, minWidth: 200 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
