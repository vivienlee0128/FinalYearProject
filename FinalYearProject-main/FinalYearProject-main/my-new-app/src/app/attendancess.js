import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/Auth";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";


// ============================================================
// 2. API CONFIG
// ============================================================
// Reads from Expo env vars instead of hardcoded strings.
// Create a .env file in your project root:
//
//   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:8080/api
//   EXPO_PUBLIC_API_KEY=replace-with-a-long-random-string
//   EXPO_PUBLIC_STUDENT_ID=S123456   (optional now — see below)
//
// Restart the Expo dev server after creating/editing .env — it's
// only read on startup, not hot-reloaded. Note: EXPO_PUBLIC_ vars
// get bundled into the client JS, so they're visible to anyone
// who inspects the app. Fine for this demo; don't ship a real
// secret this way later.

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const STUDENT_ID = process.env.EXPO_PUBLIC_STUDENT_ID;

// NEW: the student ID used to be fixed to whatever was in .env.
// Can't be hardcoded like a DEMO_STUDENTS list either, since the
// seed script generates IDs randomly — the roster below is fetched
// from Postgres instead, so it always matches whatever's actually
// in the database.


// ============================================================
// 3. FETCH ATTENDANCE FROM THE API
// ============================================================
// FIX: getAttendance() previously called fetchData(studentID) —
// but "studentID" was never defined anywhere (not a parameter,
// not a variable), so this threw "ReferenceError: studentID is
// not defined" every single time, before the fetch even ran.
//
// FIX: the old catch block swallowed the error and returned
// undefined. That made loadAttendance() crash on `data.student`
// with a confusing "Cannot read properties of undefined" instead
// of the real network error. Now we rethrow so the caller's
// catch block gets the real error and can show a proper alert.

async function fetchData(studentId) {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/attendance/${studentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    throw error; // rethrow to be handled by the caller
  }
}

async function getAttendance(studentId) {
  return fetchData(studentId); // FIX: now actually passes studentId through
}

async function fetchStudent() {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/students`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    console.error("Server rejected request. Status:", response.status, "Details:", errorDetails);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ============================================================
// 4. MAIN APPLICATION
// ============================================================

export default function AttendanceScreen() {

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------
  // State is information that can change while the application
  // is running.
  //
  // students          = roster fetched from Postgres via /api/students
  // studentsLoading   = whether the roster itself is still loading
  // selectedStudentId = which student is currently shown
  // student           = current student information
  // attendance        = attendance percentage
  // units             = student's enrolled units
  // loading           = whether we are waiting on attendance data

  const router = useRouter();
  const { isAuthenticated } = useAuth();
  //
  const [students, setStudents] = useState([]);

  const [studentsLoading, setStudentsLoading] = useState(true);

  const [selectedStudentId, setSelectedStudentId] = useState(STUDENT_ID || null);

  // NEW: holds whatever's currently typed in the free-text box,
  // separate from selectedStudentId — typing doesn't trigger a
  // fetch on every keystroke, only on submit.
  const [manualId, setManualId] = useState("");

  const [student, setStudent] = useState(null);

  const [attendance, setAttendance] = useState(null);

  const [units, setUnits] = useState([]);

  // FIX: back to false. selectedStudentId starts null until either
  // STUDENT_ID (.env) or the roster fetch below sets it, so there's
  // nothing "loading" yet at mount. Starting this true meant that if
  // the roster fetch ever failed (or the table was empty), nothing
  // would ever flip this back to false — you'd get a permanent
  // "Loading attendance..." spinner instead of the proper
  // "couldn't load" message.
  const [loading, setLoading] = useState(false);


  // ----------------------------------------------------------
  // LOAD ATTENDANCE DATA
  // ----------------------------------------------------------
  // NEW: loadAttendance now takes a studentId argument instead of
  // always reading the fixed STUDENT_ID constant, so it can be
  // re-run for whichever student is currently selected.

  async function loadAttendance(studentId) {

    setLoading(true);

    try {

      const data = await getAttendance(studentId);

      // Store the returned information in React state.

      setStudent(data.student);

      setAttendance(data.overallAttendance);

      setUnits(data.units);


    } catch (error) {

      // If something goes wrong, display an error.

      console.error(error);

      Alert.alert(
        "Error",
        "Unable to load attendance."
      );


    } finally {

      // Whether the request succeeds or fails,
      // stop showing the loading screen.

      setLoading(false);
    }
  }


  // NEW: loads the student roster once on mount. If no STUDENT_ID
  // was set via .env, default the selection to the first student
  // returned so the dashboard isn't left blank waiting for a tap.

  useEffect(() => {

    async function loadStudents() {
      try {
        const list = await fetchStudent();
        setStudents(list);

        if (!selectedStudentId && list.length > 0) {
          setSelectedStudentId(list[0].id);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        Alert.alert(
          "Error",
          "Unable to load students."
        );
      } finally {
        setStudentsLoading(false);
      }
    }

    loadStudents();
  }, []);

  // NEW: this effect now depends on selectedStudentId, so tapping
  // a different student in the switcher below automatically
  // triggers a fresh fetch — no separate button-press handler
  // needed beyond updating the state. Guarded against null since
  // selectedStudentId starts empty until the roster above loads.

  //  useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.replace("/");
  //   }
  // }, [isAuthenticated]);

  useEffect(() => {

    if (!selectedStudentId) return;

    loadAttendance(selectedStudentId);
  }, [selectedStudentId]);

  // ==========================================================
  // 5. STUDENT SWITCHER
  // ==========================================================
  // NEW: renders as its own row, always visible — including
  // while loading or if a fetch failed — so you're never stuck
  // on one student with no way to pick a different one.

  const studentSwitcher = (
    <View style={styles.switcherContainer}>
      {students.map((s) => {
        const isActive = s.id === selectedStudentId;

        return (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.switcherButton,
              isActive && styles.switcherButtonActive,
            ]}
            onPress={() => setSelectedStudentId(s.id)}
          >
            <Text
              style={[
                styles.switcherButtonText,
                isActive && styles.switcherButtonTextActive,
              ]}
            >
              {s.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // NEW: trims and uppercases before submitting, since your seeded
  // IDs are formatted like "S123456" — this way "s123456" typed by
  // hand still matches. Ignores empty submissions.

  function handleManualSubmit() {
    const cleaned = manualId.trim().toUpperCase();
    if (cleaned.length > 0) {
      setSelectedStudentId(cleaned);
    }
  }

  // NEW: a free-text box below the quick-select pills, for any
  // student ID in the database — not just the three seeded demo
  // ones. Submits on pressing "Go" or the keyboard's return key.

  const manualEntry = (
    <View style={styles.manualEntryContainer}>
      <TextInput
        style={styles.manualEntryInput}
        placeholder="Enter student ID (e.g. S123456)"
        value={manualId}
        onChangeText={setManualId}
        onSubmitEditing={handleManualSubmit}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="go"
      />
      <TouchableOpacity
        style={styles.manualEntryButton}
        onPress={handleManualSubmit}
      >
        <Text style={styles.manualEntryButtonText}>Go</Text>
      </TouchableOpacity>
    </View>
  );


  // ==========================================================
  // 6. MAIN RENDER
  // ==========================================================
  // The switcher stays on screen no matter what; only the
  // content underneath changes between loading / error / data.

  return (
    <View style={styles.screen}>
        {/* <Image source={require("../image/logo-long-full.svg")}
        style= {styles.logo}/> */}


      {studentsLoading ? (

        // NEW: covers the brief window before /api/students has
        // responded at all — separate from `loading`, which is
        // specifically about the currently selected student's
        // attendance data.

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>
            Loading students...
          </Text>
        </View>

      ) : (
        <>
          {studentSwitcher}

          {manualEntry}

          {loading ? (

            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>
                Loading attendance...
              </Text>
            </View>

          ) : !student ? (

            // FIX: if the fetch failed, `student` is still null here
            // (loading just gets set to false in `finally`). Rendering
            // student.name below would crash with "Cannot read
            // properties of null". Bail out to a simple error view
            // instead — the switcher above still lets you try another
            // student.

            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                Couldn't load attendance. Pull to refresh or try again later.
              </Text>
            </View>

          ) : (

            // FIX: Previously the header/student card/attendance card
            // sat in a plain View above the FlatList, and the QR
            // button sat below it as a sibling. A FlatList manages its
            // own internal scrolling, but the outer View was not
            // scrollable — so with a longer unit list, the QR button
            // (and any overflow) could get pushed off-screen with no
            // way to reach it.
            //
            // The fix is to make the FlatList the single scrollable
            // surface for this section: everything above the list
            // goes in ListHeaderComponent, everything below goes in
            // ListFooterComponent.

            <FlatList
              style={styles.container}
              contentContainerStyle={styles.listContent}

              data={units}

              keyExtractor={(item) => item.code}

              ListHeaderComponent={() => (
                <>
                  {/* ------------------------------------------------
                      HEADER
                      ------------------------------------------------ */}

                  <View style={styles.header}>

                    <Text style={styles.title}>
                      Attendance Dashboard
                    </Text>

                    <Text style={styles.subtitle}>
                      Swinburne Student Portal
                    </Text>

                  </View>


                  {/* ------------------------------------------------
                      STUDENT INFORMATION
                      ------------------------------------------------ */}

                  <View style={styles.studentCard}>

                    <Text style={styles.studentName}>
                      {student.name}
                    </Text>

                    <Text style={styles.studentId}>
                      Student ID: {student.id}
                    </Text>

                    <Text style={styles.studentId}>
                      SIS ID: {student.sis_id}
                    </Text>

                  </View>


                  {/* ------------------------------------------------
                      OVERALL ATTENDANCE
                      ------------------------------------------------ */}

                  <View style={styles.attendanceCard}>

                    <Text style={styles.cardTitle}>
                      Overall Attendance
                    </Text>

                    <Text style={styles.attendancePercentage}>
                      {attendance}%
                    </Text>

                  </View>


                  <Text style={styles.sectionTitle}>
                    My Units
                  </Text>
                </>
              )}

              renderItem={({ item }) => (

                <View style={styles.unitCard}>

                  <View>

                    <Text style={styles.unitCode}>
                      {item.code}
                    </Text>

                    <Text style={styles.unitName}>
                      {item.name}
                    </Text>

                  </View>


                  <Text style={styles.unitAttendance}>
                    {item.attendance}%
                  </Text>

                </View>

              )}

              ListFooterComponent={() => (

                /* --------------------------------------------------
                    SCAN QR BUTTON
                    -------------------------------------------------- */

                <TouchableOpacity 
                  style={styles.qrButton}
                  onPress={() => router.push("/qr")}>

                  <Text style={styles.qrButtonText}>
                    Scan Attendance QR
                  </Text>

                </TouchableOpacity>
              )}

            />
          )}
        </>
      )}
    </View>
  );
}


// ============================================================
// 7. STYLES
// ============================================================
// React Native uses JavaScript objects for styling.
//
// This is similar to CSS, but the syntax is slightly different.

const styles = StyleSheet.create({

  // ----------------------------------------------------------
  // SCREEN / MAIN CONTAINER
  // ----------------------------------------------------------

  screen: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  listContent: {
    padding: 20,
    paddingTop: 10,
  },


  // ----------------------------------------------------------
  // STUDENT SWITCHER
  // ----------------------------------------------------------

  switcherContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },

  switcherButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#eeeeee",
  },

  switcherButtonActive: {
    backgroundColor: "#000000",
  },

  switcherButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  switcherButtonTextActive: {
    color: "#ffffff",
  },


  // ----------------------------------------------------------
  // MANUAL ID ENTRY
  // ----------------------------------------------------------

  manualEntryContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },

  manualEntryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },

  manualEntryButton: {
    paddingHorizontal: 18,
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#000000",
  },

  manualEntryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },


  // ----------------------------------------------------------
  // LOADING SCREEN
  // ----------------------------------------------------------

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },


  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },


  // ----------------------------------------------------------
  // STUDENT CARD
  // ----------------------------------------------------------

  studentCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: "#eeeeee",
  },

  studentName: {
    fontSize: 20,
    fontWeight: "bold",
  },

  studentId: {
    marginTop: 5,
    fontSize: 14,
  },


  // ----------------------------------------------------------
  // ATTENDANCE CARD
  // ----------------------------------------------------------

  attendanceCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: "#eeeeee",
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 16,
  },

  attendancePercentage: {
    fontSize: 42,
    fontWeight: "bold",
    marginTop: 5,
  },


  // ----------------------------------------------------------
  // UNIT LIST
  // ----------------------------------------------------------

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },

  unitCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#eeeeee",

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  unitCode: {
    fontSize: 14,
    fontWeight: "bold",
  },

  unitName: {
    fontSize: 14,
    marginTop: 4,
  },

  unitAttendance: {
    fontSize: 20,
    fontWeight: "bold",
  },


  // ----------------------------------------------------------
  // QR BUTTON
  // ----------------------------------------------------------

  qrButton: {
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    backgroundColor: "#000000",
  },

  qrButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

});