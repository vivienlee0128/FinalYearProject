import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";

import { useRouter } from "expo-router";

import {
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


export default function ScanQRScreen() {

  const router = useRouter();

  const [
    permission,
    requestPermission,
  ] = useCameraPermissions();

  const [
    scanned,
    setScanned,
  ] = useState(false);

  const [
    qrPayload,
    setQrPayload,
  ] = useState<string | null>(null);

  const scanInFlight =
    useRef(false);


  // ==========================================
  // WEB
  // ==========================================

  if (Platform.OS === "web") {

    return (

      <View
        style={
          styles.centeredContainer
        }
      >

        <Text
          style={
            styles.notSupportedText
          }
        >
          QR attendance scanning should
          be tested on a physical Android
          or iOS device.
        </Text>


        <TouchableOpacity
          style={styles.darkButton}
          onPress={() =>
            router.back()
          }
        >

          <Text
            style={
              styles.darkButtonText
            }
          >
            Go Back
          </Text>

        </TouchableOpacity>

      </View>

    );

  }


  // ==========================================
  // PERMISSION LOADING
  // ==========================================

  if (!permission) {

    return (

      <View
        style={
          styles.centeredContainer
        }
      >

        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.permissionText
          }
        >
          Checking camera permission...
        </Text>

      </View>

    );

  }


  // ==========================================
  // CAMERA PERMISSION
  // ==========================================

  if (!permission.granted) {

    return (

      <View
        style={
          styles.centeredContainer
        }
      >

        <Text
          style={styles.permissionTitle}
        >
          Camera Permission Required
        </Text>


        <Text
          style={
            styles.permissionText
          }
        >
          Camera access is required to
          scan the lecturer&apos;s
          attendance QR code.
        </Text>


        <TouchableOpacity
          style={styles.darkButton}
          onPress={() =>
            void requestPermission()
          }
        >

          <Text
            style={
              styles.darkButtonText
            }
          >
            Grant Camera Permission
          </Text>

        </TouchableOpacity>

      </View>

    );

  }


  // ==========================================
  // QR SCANNER
  // ==========================================

  function handleBarCodeScanned(
    result: BarcodeScanningResult
  ) {

    if (
      scanned ||
      scanInFlight.current
    ) {
      return;
    }


    scanInFlight.current = true;


    const data =
      result.data;


    console.log(
      "=============================="
    );

    console.log(
      "[QR] QR CODE DETECTED"
    );

    console.log(
      "[QR] Type:",
      result.type
    );

    console.log(
      "[QR] Raw payload:"
    );

    console.log(
      data
    );

    console.log(
      "[QR] Length:",
      data.length
    );

    console.log(
      "=============================="
    );


    setQrPayload(data);

    setScanned(true);

    scanInFlight.current = false;

  }


  // ==========================================
  // RESET SCANNER
  // ==========================================

  function scanAgain() {

    scanInFlight.current = false;

    setQrPayload(null);

    setScanned(false);

  }


  // ==========================================
  // RESULT SCREEN
  // ==========================================

  if (
    scanned &&
    qrPayload
  ) {

    return (

      <ScrollView
        contentContainerStyle={
          styles.resultContainer
        }
      >

        <View
          style={
            styles.successIcon
          }
        >

          <Text
            style={
              styles.successIconText
            }
          >
            ✓
          </Text>

        </View>


        <Text
          style={
            styles.resultTitle
          }
        >
          QR Code Detected
        </Text>


        <Text
          style={
            styles.resultDescription
          }
        >
          The QR code was read
          successfully.
        </Text>


        {/* IMPORTANT WARNING */}

        <View
          style={
            styles.warningCard
          }
        >

          <Text
            style={
              styles.warningTitle
            }
          >
            Development Mode
          </Text>


          <Text
            style={
              styles.warningText
            }
          >
            This QR code has NOT been
            submitted to Qwickly or n8n.
            We are only inspecting its
            raw contents.
          </Text>

        </View>


        {/* QR INFORMATION */}

        <View
          style={
            styles.card
          }
        >

          <Text
            style={
              styles.cardLabel
            }
          >
            QR Type
          </Text>


          <Text
            style={
              styles.cardValue
            }
          >
            QR Code
          </Text>


          <Text
            style={[
              styles.cardLabel,
              styles.payloadLabel,
            ]}
          >
            Raw QR Payload
          </Text>


          <View
            style={
              styles.payloadBox
            }
          >

            <Text
              selectable
              style={
                styles.payloadText
              }
            >
              {qrPayload}
            </Text>

          </View>


          <Text
            style={
              styles.lengthText
            }
          >
            Payload length:
            {" "}
            {qrPayload.length}
            {" "}
            characters
          </Text>

        </View>


        {/* SCAN AGAIN */}

        <TouchableOpacity
          style={
            styles.darkButton
          }
          onPress={
            scanAgain
          }
        >

          <Text
            style={
              styles.darkButtonText
            }
          >
            Scan Another QR
          </Text>

        </TouchableOpacity>


        {/* BACK */}

        <TouchableOpacity
          style={
            styles.outlineButton
          }
          onPress={() =>
            router.back()
          }
        >

          <Text
            style={
              styles.outlineButtonText
            }
          >
            Go Back
          </Text>

        </TouchableOpacity>

      </ScrollView>

    );

  }


  // ==========================================
  // CAMERA SCREEN
  // ==========================================

  return (

    <View
      style={
        styles.container
      }
    >

      <CameraView
        style={
          styles.camera
        }
        facing="back"
        onBarcodeScanned={
          scanned
            ? undefined
            : handleBarCodeScanned
        }
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
          ],
        }}
      />


      {/* DARK OVERLAY */}

      <View
        style={
          styles.topOverlay
        }
      />


      <View
        style={
          styles.bottomOverlay
        }
      >


        <Text
          style={
            styles.scanTitle
          }
        >
          Scan Attendance QR
        </Text>


        <Text
          style={
            styles.hint
          }
        >
          Point your camera at the
          lecturer&apos;s Qwickly
          attendance QR code.
        </Text>


        <Text
          style={
            styles.developmentText
          }
        >
          Development mode — QR will
          only be inspected.
        </Text>

      </View>


      {/* QR TARGET */}

      <View
        pointerEvents="none"
        style={
          styles.scanArea
        }
      >

        <View
          style={
            styles.scanBox
          }
        >

          <View
            style={[
              styles.corner,
              styles.topLeft,
            ]}
          />

          <View
            style={[
              styles.corner,
              styles.topRight,
            ]}
          />

          <View
            style={[
              styles.corner,
              styles.bottomLeft,
            ]}
          />

          <View
            style={[
              styles.corner,
              styles.bottomRight,
            ]}
          />

        </View>

      </View>

    </View>

  );

}


// ============================================
// STYLES
// ============================================

const styles =
  StyleSheet.create({

    container: {

      flex: 1,

      backgroundColor:
        "#000000",

    },


    camera: {

      flex: 1,

    },


    topOverlay: {

      position: "absolute",

      top: 0,

      left: 0,

      right: 0,

      height: 100,

      backgroundColor:
        "rgba(0,0,0,0.45)",

    },


    bottomOverlay: {

      position: "absolute",

      bottom: 0,

      left: 0,

      right: 0,

      paddingHorizontal: 24,

      paddingTop: 24,

      paddingBottom: 40,

      backgroundColor:
        "rgba(0,0,0,0.75)",

      alignItems: "center",

    },


    scanArea: {

      position: "absolute",

      top: 0,

      left: 0,

      right: 0,

      bottom: 0,

      justifyContent:
        "center",

      alignItems:
        "center",

    },


    scanBox: {

      width: 250,

      height: 250,

      position:
        "relative",

    },


    corner: {

      position:
        "absolute",

      width: 45,

      height: 45,

      borderColor:
        "#ffffff",

    },


    topLeft: {

      top: 0,

      left: 0,

      borderTopWidth: 4,

      borderLeftWidth: 4,

      borderTopLeftRadius: 12,

    },


    topRight: {

      top: 0,

      right: 0,

      borderTopWidth: 4,

      borderRightWidth: 4,

      borderTopRightRadius: 12,

    },


    bottomLeft: {

      bottom: 0,

      left: 0,

      borderBottomWidth: 4,

      borderLeftWidth: 4,

      borderBottomLeftRadius: 12,

    },


    bottomRight: {

      bottom: 0,

      right: 0,

      borderBottomWidth: 4,

      borderRightWidth: 4,

      borderBottomRightRadius: 12,

    },


    scanTitle: {

      color: "#ffffff",

      fontSize: 20,

      fontWeight: "700",

      marginBottom: 8,

    },


    hint: {

      color: "#ffffff",

      fontSize: 14,

      textAlign: "center",

      lineHeight: 20,

    },


    developmentText: {

      color: "#cccccc",

      fontSize: 12,

      marginTop: 12,

      textAlign: "center",

    },


    centeredContainer: {

      flex: 1,

      justifyContent:
        "center",

      alignItems:
        "center",

      padding: 24,

      gap: 16,

      backgroundColor:
        "#ffffff",

    },


    permissionTitle: {

      fontSize: 20,

      fontWeight: "700",

    },


    permissionText: {

      fontSize: 14,

      textAlign: "center",

      color: "#444444",

      lineHeight: 21,

    },


    notSupportedText: {

      fontSize: 14,

      textAlign: "center",

      color: "#444444",

      lineHeight: 22,

    },


    resultContainer: {

      flexGrow: 1,

      padding: 24,

      backgroundColor:
        "#f5f5f5",

      alignItems:
        "center",

    },


    successIcon: {

      width: 70,

      height: 70,

      borderRadius: 35,

      backgroundColor:
        "#111111",

      justifyContent:
        "center",

      alignItems:
        "center",

      marginTop: 40,

    },


    successIconText: {

      color: "#ffffff",

      fontSize: 34,

      fontWeight: "700",

    },


    resultTitle: {

      fontSize: 24,

      fontWeight: "700",

      marginTop: 20,

    },


    resultDescription: {

      fontSize: 14,

      color: "#666666",

      marginTop: 6,

      marginBottom: 20,

      textAlign: "center",

    },


    warningCard: {

      width: "100%",

      maxWidth: 600,

      padding: 16,

      borderRadius: 12,

      backgroundColor:
        "#fff7e6",

      marginBottom: 16,

    },


    warningTitle: {

      fontWeight: "700",

      marginBottom: 5,

    },


    warningText: {

      color: "#555555",

      fontSize: 13,

      lineHeight: 19,

    },


    card: {

      width: "100%",

      maxWidth: 600,

      padding: 18,

      borderRadius: 12,

      backgroundColor:
        "#ffffff",

      marginBottom: 20,

    },


    cardLabel: {

      fontSize: 12,

      color: "#666666",

    },


    cardValue: {

      fontSize: 16,

      fontWeight: "600",

      marginTop: 3,

    },


    payloadLabel: {

      marginTop: 20,

    },


    payloadBox: {

      marginTop: 8,

      padding: 14,

      borderRadius: 8,

      backgroundColor:
        "#eeeeee",

    },


    payloadText: {

      fontSize: 13,

      lineHeight: 19,

      color: "#111111",

    },


    lengthText: {

      fontSize: 12,

      color: "#777777",

      marginTop: 8,

    },


    darkButton: {

      width: "100%",

      maxWidth: 600,

      paddingVertical: 15,

      paddingHorizontal: 28,

      borderRadius: 10,

      backgroundColor:
        "#111111",

      alignItems:
        "center",

      marginBottom: 10,

    },


    darkButtonText: {

      fontSize: 14,

      fontWeight: "600",

      color: "#ffffff",

    },


    outlineButton: {

      width: "100%",

      maxWidth: 600,

      paddingVertical: 15,

      paddingHorizontal: 28,

      borderRadius: 10,

      borderWidth: 1,

      borderColor:
        "#111111",

      alignItems:
        "center",

    },


    outlineButtonText: {

      fontSize: 14,

      fontWeight: "600",

      color: "#111111",

    },

  });