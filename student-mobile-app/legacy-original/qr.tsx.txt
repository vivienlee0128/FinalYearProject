import type {
  BarcodeScanningResult,
} from "expo-camera";

import {
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

import { useAuth } from "../context/Auth";

import {
  submitDemoQrAttendance,
  type DemoQrResult,
} from "../services/qrAttendanceAPI";

import {
  checkInStudent,
} from "../services/checkInAPI";

import type {
  CheckInResponse,
} from "../services/checkInAPI";


// ============================================
// QWICKLY QR STRUCTURE
// ============================================

interface ParsedQwicklyQR {
  raw: string;

  // Confirmed Canvas / Qwickly course LMS ID.
  courseLmsId: string;

  // Qwickly check-in/context identifier.
  // Exact internal semantics are not documented.
  checkInId: string;

  // Changes while the QR is displayed.
  // Exact Qwickly validation algorithm is not documented.
  rotatingValue: string;
}


// ============================================
// SCREEN
// ============================================

export default function ScanQRScreen() {
  const router = useRouter();

  const { user } = useAuth();

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
  ] = useState<string | null>(
    null
  );

  const [
    parsedQR,
    setParsedQR,
  ] = useState<ParsedQwicklyQR | null>(
    null
  );

  const [
    checkInResult,
    setCheckInResult,
  ] = useState<CheckInResponse | null>(
    null
  );

  const [
    checkInError,
    setCheckInError,
  ] = useState<string | null>(
    null
  );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [demoResult, setDemoResult] = useState<DemoQrResult | null>(null);
  const [isDemoQr, setIsDemoQr] = useState(false);

  const scanInFlight =
    useRef(false);


  // ==========================================
  // QR PARSER
  // ==========================================

  function parseQwicklyQR(
    data: string
  ): ParsedQwicklyQR | null {
    try {
      const url =
        new URL(data);

      // Only accept the known Qwickly
      // attendance QR URL.
      if (
        url.hostname.toLowerCase() !==
          "www.qwickly.tools" ||
        url.pathname !== "/checkin"
      ) {
        return null;
      }

      const id =
        url.searchParams.get("id");

      if (!id) {
        return null;
      }

      /*
       * Real observed format:
       *
       * https://www.qwickly.tools/checkin
       * ?id=2244|58065|336
       *
       * 2244  = Course LMS ID
       * 58065 = Check-in/context identifier
       * 336   = Rotating value
       */

      const parts =
        id.split("|");

      if (parts.length !== 3) {
        return null;
      }

      const [
        courseLmsId,
        checkInId,
        rotatingValue,
      ] = parts;

      if (
        !courseLmsId ||
        !checkInId ||
        !rotatingValue
      ) {
        return null;
      }

      // All observed Qwickly QR components
      // are numeric.
      if (
        !/^\d+$/.test(courseLmsId) ||
        !/^\d+$/.test(checkInId) ||
        !/^\d+$/.test(rotatingValue)
      ) {
        return null;
      }

      return {
        raw: data,
        courseLmsId,
        checkInId,
        rotatingValue,
      };

    } catch (error) {
      console.log(
        "[QR] Failed to parse QR:",
        error
      );

      return null;
    }
  }


  // ==========================================
  // QR SCANNER
  // ==========================================

  async function handleBarCodeScanned(
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
      "================================"
    );

    console.log(
      "[QR] QR CODE SCANNED"
    );

    console.log(
      "[QR] Type:",
      result.type
    );

    // Do not log raw QR tokens or rotating check-in values.
    console.log("[QR] Payload length:", data.length);


    // ========================================
    // FYP DEMO QR: JSON, not a Qwickly URL
    // ========================================

    let isDemo = false;
    try {
      const payload: unknown = JSON.parse(data);
      isDemo =
        payload !== null &&
        typeof payload === "object" &&
        (payload as { type?: unknown }).type === "FYP_ATTENDANCE_DEMO";
    } catch {
      // Not JSON: the existing Qwickly URL parser handles it below.
    }

    if (isDemo) {
      setIsDemoQr(true);
      setQrPayload(data);
      setParsedQR(null);
      setScanned(true);
      setCheckInError(null);
      setCheckInResult(null);
      setDemoResult(null);
      setSubmitting(true);

      try {
        const sisId = String(user?.sisId ?? user?.studentId ?? "").trim();
        if (!sisId) {
          throw new Error("Unable to determine the signed-in student's SIS ID.");
        }
        const response = await submitDemoQrAttendance(data, sisId);
        setDemoResult(response);
        console.log("[FYP DEMO QR]", response.status, response.message);
      } catch (error) {
        setCheckInError(
          error instanceof Error ? error.message : "Demo QR validation failed."
        );
      } finally {
        setSubmitting(false);
        scanInFlight.current = false;
      }
      return;
    }

    // ========================================
    // EXISTING QWICKLY URL QR
    // ========================================

    setIsDemoQr(false);
    const parsed =
      parseQwicklyQR(data);

    setQrPayload(data);
    setParsedQR(parsed);
    setScanned(true);


    // ========================================
    // INVALID QR
    // ========================================

    if (!parsed) {
      console.log(
        "[QR] Not a recognised Qwickly QR"
      );

      setCheckInError(
        "This is not a recognised Qwickly attendance QR code."
      );

      scanInFlight.current = false;

      return;
    }


    console.log(
      "[QR] Valid Qwickly QR"
    );

    console.log(
      "[QR] Course LMS ID:",
      parsed.courseLmsId
    );

    console.log(
      "[QR] Check-in ID:",
      parsed.checkInId
    );

    console.log(
      "[QR] Rotating value:",
      parsed.rotatingValue
    );


    // ========================================
    // GET LOGGED-IN STUDENT
    // ========================================

    const sisId =
      String(
        user?.sisId ??
        user?.studentId ??
        ""
      ).trim();

    if (!sisId) {
      setCheckInError(
        "Unable to determine the logged-in student's SIS ID."
      );

      scanInFlight.current = false;

      return;
    }


    console.log(
      "[QR] Logged-in SIS ID:",
      sisId
    );


    // ========================================
    // SEND QR TO N8N
    // ========================================

    try {
      setSubmitting(true);

      setCheckInError(null);
      setCheckInResult(null);

      const response =
        await checkInStudent({
          sisId,

          courseLmsId:
            parsed.courseLmsId,

          checkInId:
            parsed.checkInId,

          rotatingValue:
            parsed.rotatingValue,

          rawQr:
            parsed.raw,
        });

      console.log(
        "[CHECK-IN] Validation result:",
        response
      );

      setCheckInResult(
        response
      );

    } catch (error) {
      console.error(
        "[CHECK-IN] Failed:",
        error
      );

      setCheckInError(
        error instanceof Error
          ? error.message
          : "Unable to validate attendance QR."
      );

    } finally {
      setSubmitting(false);

      scanInFlight.current = false;
    }

    console.log(
      "================================"
    );
  }


  // ==========================================
  // RESET SCANNER
  // ==========================================

  function scanAgain() {
    scanInFlight.current = false;

    setQrPayload(null);
    setParsedQR(null);

    setCheckInResult(null);
    setCheckInError(null);
    setDemoResult(null);
    setIsDemoQr(false);

    setSubmitting(false);
    setScanned(false);
  }


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
            styles.permissionTitle
          }
        >
          QR Scanner
        </Text>

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
          style={
            styles.darkButton
          }
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
  // CAMERA PERMISSION LOADING
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
  // CAMERA PERMISSION REQUIRED
  // ==========================================

  if (!permission.granted) {
    return (
      <View
        style={
          styles.centeredContainer
        }
      >
        <Text
          style={
            styles.permissionTitle
          }
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
          style={
            styles.darkButton
          }
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
      </View>
    );
  }


  // ==========================================
  // RESULT SCREEN
  // ==========================================

  if (
    scanned &&
    qrPayload
  ) {

    // ========================================
    // LOADING
    // ========================================

    if (submitting) {
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
              styles.resultTitle
            }
          >
            Validating QR
          </Text>

          <Text
            style={
              styles.resultDescription
            }
          >
            Checking your student
            account, course enrollment
            and attendance session...
          </Text>
        </View>
      );
    }


    // ========================================
    // DEMO RESULT (never an official Qwickly check-in)
    // ========================================

    if (isDemoQr) {
      const success = demoResult?.ok === true;
      return (
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.resultIcon, success ? styles.validIcon : styles.invalidIcon]}>
            <Text style={styles.resultIconText}>{success ? "✓" : "!"}</Text>
          </View>
          <Text style={styles.resultTitle}>
            {success ? "Demo Attendance Accepted" : "Demo Check-in Not Accepted"}
          </Text>
          <Text style={styles.resultDescription}>
            {checkInError ?? demoResult?.message ?? "Unable to verify this demo QR."}
          </Text>
          {demoResult?.courseCode ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Demo Session</Text>
              <Text style={styles.cardLabel}>Unit</Text>
              <Text style={styles.cardValue}>{demoResult.courseCode}</Text>
              {demoResult.sessionId ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.cardLabel}>Session ID</Text>
                  <Text style={styles.cardValue}>{demoResult.sessionId}</Text>
                </>
              ) : null}
            </View>
          ) : null}
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>FYP Demo Only</Text>
            <Text style={styles.warningText}>
              This is a simulated check-in. Attendance was NOT recorded in Qwickly
              and is not valid for official attendance or visa compliance.
            </Text>
          </View>
          <TouchableOpacity style={styles.darkButton} onPress={scanAgain}>
            <Text style={styles.darkButtonText}>Scan Another QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={() => router.back()}>
            <Text style={styles.outlineButtonText}>Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // ========================================
    // ERROR
    // ========================================

    if (checkInError) {
      return (
        <ScrollView
          contentContainerStyle={
            styles.resultContainer
          }
        >
          <View
            style={[
              styles.resultIcon,
              styles.invalidIcon,
            ]}
          >
            <Text
              style={
                styles.resultIconText
              }
            >
              !
            </Text>
          </View>

          <Text
            style={
              styles.resultTitle
            }
          >
            Check-in Failed
          </Text>

          <Text
            style={
              styles.resultDescription
            }
          >
            The attendance QR could not
            be validated.
          </Text>

          <View
            style={
              styles.invalidCard
            }
          >
            <Text
              style={
                styles.invalidTitle
              }
            >
              Unable to Validate QR
            </Text>

            <Text
              style={
                styles.invalidText
              }
            >
              {checkInError}
            </Text>
          </View>

          {parsedQR && (
            <View
              style={
                styles.card
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Scanned QR
              </Text>

              <Text
                style={
                  styles.cardLabel
                }
              >
                Course LMS ID
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {parsedQR.courseLmsId}
              </Text>

              <View
                style={
                  styles.divider
                }
              />

              <Text
                style={
                  styles.cardLabel
                }
              >
                Check-in ID
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {parsedQR.checkInId}
              </Text>

              <View
                style={
                  styles.divider
                }
              />

              <Text
                style={
                  styles.cardLabel
                }
              >
                Rotating Value
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {parsedQR.rotatingValue}
              </Text>
            </View>
          )}

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


    // ========================================
    // SUCCESSFUL N8N VALIDATION
    // ========================================

    if (checkInResult) {
      const result =
        checkInResult;

      const alreadyRecorded =
        result.attendanceCheck
          .alreadyRecorded;

      return (
        <ScrollView
          contentContainerStyle={
            styles.resultContainer
          }
        >
          <View
            style={[
              styles.resultIcon,
              styles.validIcon,
            ]}
          >
            <Text
              style={
                styles.resultIconText
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
            QR Verified
          </Text>


          <Text
            style={
              styles.resultDescription
            }
          >
            Your student account,
            course enrollment and
            attendance session were
            checked successfully.
          </Text>


          {/* ==================================
              TEST MODE
          ================================== */}

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
              Test Mode
            </Text>

            <Text
              style={
                styles.warningText
              }
            >
              QR validation completed.
              Attendance was not submitted
              because the current Qwickly
              API credential has read-only
              access.
            </Text>
          </View>


          {/* ==================================
              COURSE
          ================================== */}

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Course
            </Text>

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Course Name
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {result.course.name}
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Course Code
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {result.course.code}
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Course LMS ID
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {result.course.lmsId}
              </Text>
            </View>
          </View>


          {/* ==================================
              STUDENT
          ================================== */}

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Student
            </Text>

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Name
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {result.student.name}
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Student ID
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {result.student.sisId}
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Email
              </Text>

              <Text
                selectable
                style={
                  styles.cardValue
                }
              >
                {result.student.email}
              </Text>
            </View>
          </View>


          {/* ==================================
              SESSION
          ================================== */}

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Attendance Session
            </Text>

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Session
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {
                  result
                    .candidateSession
                    .title ??
                  "Attendance Session"
                }
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Session ID
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {
                  result
                    .candidateSession
                    .id
                }
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Method
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {
                  result
                    .candidateSession
                    .method ??
                  "Check In"
                }
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Session Age
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {
                  result
                    .candidateSession
                    .ageMinutes
                }{" "}
                minute(s)
              </Text>
            </View>
          </View>


          {/* ==================================
              VALIDATION
          ================================== */}

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Validation
            </Text>

            <ValidationRow
              label="Student identified"
              passed={
                result.validation
                  .studentIdentified
              }
            />

            <View
              style={
                styles.divider
              }
            />

            <ValidationRow
              label="Course identified"
              passed={
                result.validation
                  .courseIdentified
              }
            />

            <View
              style={
                styles.divider
              }
            />

            <ValidationRow
              label="Enrollment confirmed"
              passed={
                result.validation
                  .enrollmentVerified
              }
            />

            <View
              style={
                styles.divider
              }
            />

            <ValidationRow
              label="Recent session found"
              passed={
                result.validation
                  .recentSessionFound
              }
            />

            <View
              style={
                styles.divider
              }
            />

            <ValidationRow
              label={
                alreadyRecorded
                  ? "Attendance record already exists"
                  : "No existing attendance record"
              }
              passed={
                !alreadyRecorded
              }
            />
          </View>


          {/* ==================================
              TECHNICAL DETAILS
          ================================== */}

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Technical Details
            </Text>

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Workflow Status
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {result.status}
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Check-in ID
              </Text>

              <Text
                selectable
                style={
                  styles.cardValue
                }
              >
                {
                  result.qr
                    .checkInId
                }
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Rotating Value
              </Text>

              <Text
                selectable
                style={
                  styles.cardValue
                }
              >
                {
                  result.qr
                    .rotatingValue
                }
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                REST Session ID
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {
                  result
                    .candidateSession
                    .id
                }
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Existing Attendance
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {
                  alreadyRecorded
                    ? "Yes"
                    : "No"
                }
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                QR Freshness Verified
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {
                  result.validation
                    .qwicklyQrFreshnessVerified
                    ? "Yes"
                    : "No"
                }
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                QR / Session Mapping
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {
                  result.validation
                    .qrSessionMappingVerified
                    ? "Verified"
                    : "Unverified"
                }
              </Text>
            </View>
          </View>


          {/* ==================================
              LIMITATION
          ================================== */}

          {result.limitation && (
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
                Integration Limitation
              </Text>

              <Text
                style={
                  styles.warningText
                }
              >
                {result.limitation}
              </Text>
            </View>
          )}


          {/* ==================================
              RAW QR
          ================================== */}

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              QR Information
            </Text>

            <Text
              style={
                styles.cardLabel
              }
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
                {result.qr.raw}
              </Text>
            </View>
          </View>


          {/* ==================================
              BUTTONS
          ================================== */}

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


    // ========================================
    // FALLBACK
    // ========================================

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
          Processing QR...
        </Text>
      </View>
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


      {/* DARK TOP OVERLAY */}

      <View
        pointerEvents="none"
        style={
          styles.topOverlay
        }
      />


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


      {/* BOTTOM INFORMATION */}

      <View
        pointerEvents="none"
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
          Test mode — QR will be
          validated through the
          attendance service.
        </Text>
      </View>
    </View>
  );
}


// ============================================
// VALIDATION ROW
// ============================================

function ValidationRow({
  label,
  passed,
}: {
  label: string;
  passed: boolean;
}) {
  return (
    <View
      style={
        styles.validationRow
      }
    >
      <View
        style={[
          styles.validationIndicator,
          passed
            ? styles.validationPassed
            : styles.validationFailed,
        ]}
      >
        <Text
          style={
            styles.validationIndicatorText
          }
        >
          {passed ? "✓" : "!"}
        </Text>
      </View>

      <Text
        style={
          styles.validationText
        }
      >
        {label}
      </Text>
    </View>
  );
}


// ============================================
// STYLES
// ============================================

const styles =
  StyleSheet.create({

    // ========================================
    // CAMERA
    // ========================================

    container: {
      flex: 1,
      backgroundColor:
        "#000000",
    },

    camera: {
      flex: 1,
    },


    // ========================================
    // CAMERA OVERLAY
    // ========================================

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

      alignItems:
        "center",
    },

    scanArea: {
      position:
        "absolute",

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

      borderTopLeftRadius:
        12,
    },

    topRight: {
      top: 0,
      right: 0,

      borderTopWidth: 4,
      borderRightWidth: 4,

      borderTopRightRadius:
        12,
    },

    bottomLeft: {
      bottom: 0,
      left: 0,

      borderBottomWidth: 4,
      borderLeftWidth: 4,

      borderBottomLeftRadius:
        12,
    },

    bottomRight: {
      bottom: 0,
      right: 0,

      borderBottomWidth: 4,
      borderRightWidth: 4,

      borderBottomRightRadius:
        12,
    },

    scanTitle: {
      color:
        "#ffffff",

      fontSize: 20,
      fontWeight: "700",

      marginBottom: 8,
    },

    hint: {
      color:
        "#ffffff",

      fontSize: 14,

      textAlign:
        "center",

      lineHeight: 20,
    },

    developmentText: {
      color:
        "#cccccc",

      fontSize: 12,

      marginTop: 12,

      textAlign:
        "center",
    },


    // ========================================
    // PERMISSIONS / WEB
    // ========================================

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

      color:
        "#111111",

      textAlign:
        "center",
    },

    permissionText: {
      fontSize: 14,

      textAlign:
        "center",

      color:
        "#444444",

      lineHeight: 21,
    },

    notSupportedText: {
      fontSize: 14,

      textAlign:
        "center",

      color:
        "#444444",

      lineHeight: 22,

      maxWidth: 500,
    },


    // ========================================
    // RESULT
    // ========================================

    resultContainer: {
      flexGrow: 1,

      padding: 24,
      paddingBottom: 50,

      backgroundColor:
        "#f5f5f5",

      alignItems:
        "center",
    },

    resultIcon: {
      width: 70,
      height: 70,

      borderRadius: 35,

      justifyContent:
        "center",

      alignItems:
        "center",

      marginTop: 40,
    },

    validIcon: {
      backgroundColor:
        "#111111",
    },

    invalidIcon: {
      backgroundColor:
        "#8b0000",
    },

    resultIconText: {
      color:
        "#ffffff",

      fontSize: 34,

      fontWeight:
        "700",
    },

    resultTitle: {
      fontSize: 24,

      fontWeight:
        "700",

      color:
        "#111111",

      marginTop: 20,

      textAlign:
        "center",
    },

    resultDescription: {
      fontSize: 14,

      color:
        "#666666",

      marginTop: 6,
      marginBottom: 20,

      textAlign:
        "center",

      lineHeight: 20,

      maxWidth: 600,
    },


    // ========================================
    // WARNING
    // ========================================

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
      fontSize: 15,

      fontWeight:
        "700",

      color:
        "#111111",

      marginBottom: 5,
    },

    warningText: {
      color:
        "#555555",

      fontSize: 13,

      lineHeight: 19,
    },


    // ========================================
    // CARDS
    // ========================================

    card: {
      width: "100%",
      maxWidth: 600,

      padding: 18,

      borderRadius: 12,

      backgroundColor:
        "#ffffff",

      marginBottom: 20,
    },

    sectionTitle: {
      fontSize: 17,

      fontWeight:
        "700",

      color:
        "#111111",

      marginBottom: 18,
    },

    infoRow: {
      paddingVertical: 4,
    },

    divider: {
      height: 1,

      backgroundColor:
        "#eeeeee",

      marginVertical: 12,
    },

    cardLabel: {
      fontSize: 12,

      color:
        "#666666",
    },

    cardValue: {
      fontSize: 16,

      fontWeight:
        "600",

      marginTop: 3,

      color:
        "#111111",
    },


    // ========================================
    // VALIDATION
    // ========================================

    validationRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 12,
    },

    validationIndicator: {
      width: 28,
      height: 28,

      borderRadius: 14,

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    validationPassed: {
      backgroundColor:
        "#111111",
    },

    validationFailed: {
      backgroundColor:
        "#8b0000",
    },

    validationIndicatorText: {
      color:
        "#ffffff",

      fontSize: 14,

      fontWeight:
        "700",
    },

    validationText: {
      flex: 1,

      fontSize: 14,

      fontWeight:
        "600",

      color:
        "#111111",
    },


    // ========================================
    // RAW PAYLOAD
    // ========================================

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

      color:
        "#111111",
    },


    // ========================================
    // ERROR
    // ========================================

    invalidCard: {
      width: "100%",
      maxWidth: 600,

      padding: 18,

      borderRadius: 12,

      backgroundColor:
        "#fff1f1",

      marginBottom: 20,
    },

    invalidTitle: {
      fontSize: 16,

      fontWeight:
        "700",

      color:
        "#8b0000",
    },

    invalidText: {
      fontSize: 13,

      color:
        "#555555",

      lineHeight: 19,

      marginTop: 6,
    },


    // ========================================
    // BUTTONS
    // ========================================

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

      fontWeight:
        "600",

      color:
        "#ffffff",
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

      fontWeight:
        "600",

      color:
        "#111111",
    },
  });