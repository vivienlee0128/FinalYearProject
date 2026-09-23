// // import { useRouter } from "expo-router";
// // import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// // import { useAuth } from "../context/Auth";

// // export default function HomeScreen() {
// //   const router = useRouter();
// //   const { isAuthenticated, user, signOut } = useAuth();

// //   // NEW: guard — if this screen is somehow reached without a
// //   // successful sign-in (deep link, state reset), bounce back to
// //   // login instead of showing anything.
// //   // useEffect(() => {
// //   //   if (!isAuthenticated) {
// //   //     router.replace("/");
// //   //   }
// //   // }, [isAuthenticated]);

// //   // if (!isAuthenticated) return null;

// //   function comingSoon() {
// //     Alert.alert("Coming soon", "This feature isn't built yet.");
// //   }

// //   return (
// //     <View style={styles.container}>
// //       <Text style={styles.welcome}>Welcome, {user?.name || "student"}</Text>

// //       <TouchableOpacity
// //         style={styles.button}
// //         onPress={() => router.push("/attendance")}
// //       >
// //         <Text style={styles.buttonText}>View Attendance</Text>
// //       </TouchableOpacity>

// //       {/* NEW: placeholder buttons — replace comingSoon() with real
// //           navigation once each feature has its own screen. */}

// //       <TouchableOpacity style={styles.buttonSecondary} onPress={() => {
// //         router.push("/lecture");
// //       }}>
// //         <Text style={styles.buttonSecondaryText}>Scan QR</Text>
// //       </TouchableOpacity>

// //       <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push("/demo")}>
// //         <Text style={styles.buttonSecondaryText}>Settings</Text>
// //       </TouchableOpacity>

// //       <TouchableOpacity
// //         style={styles.signOutButton}
// //         onPress={() => {
// //           signOut();
// //           router.replace("/");
// //         }}
// //       >
// //         <Text style={styles.signOutText}>Sign Out</Text>
// //       </TouchableOpacity>
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     justifyContent: "center",
// //     alignItems: "center",
// //     padding: 24,
// //     gap: 12,
// //   },
// //   welcome: {
// //     fontSize: 20,
// //     fontWeight: "bold",
// //     marginBottom: 20,
// //     textAlign: "center",
// //   },
// //   button: {
// //     width: "100%",
// //     paddingVertical: 14,
// //     borderRadius: 10,
// //     alignItems: "center",
// //     backgroundColor: "#000000",
// //   },
// //   buttonText: {
// //     color: "#ffffff",
// //     fontSize: 16,
// //     fontWeight: "600",
// //   },
// //   buttonSecondary: {
// //     width: "100%",
// //     paddingVertical: 14,
// //     borderRadius: 10,
// //     alignItems: "center",
// //     backgroundColor: "#eeeeee",
// //   },
// //   buttonSecondaryText: {
// //     fontSize: 16,
// //     fontWeight: "600",
// //   },
// //   signOutButton: {
// //     marginTop: 20,
// //     paddingVertical: 10,
// //   },
// //   signOutText: {
// //     color: "#cc0000",
// //     fontSize: 14,
// //     fontWeight: "600",
// //   },
// // });

// //Version 2

// import { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
// import { useGlobalSearchParams } from 'expo-router';
// // import { fetchStudentAttendance , fetchStudentProfile } from '../app/services/qwickly';
// import { fetchStudentAttendanceViaN8N } from '../app/services/qwickly';

// export default function HomeScreen() {
//   // Capture the studentID passed from the login route (or the web URL)
//   const { studentID } = useGlobalSearchParams<{ studentID: string }>();
  
//   const [loading, setLoading] = useState(false);
//   const [attendanceData, setAttendanceData] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     async function loadData() {
//       if (!studentID) return;
      
//       setLoading(true);
//       setError(null);
      
//       // try {
//       //   const data = await fetchStudentAttendance(studentID);
//       //   if (data) {
//       //     setAttendanceData(data);
//       //   } else {
//       //     setError("No data found for this Student ID.");
//       //   }
//       // } catch (err) {
//       //   setError("An error occurred while fetching data.");
//       // } finally {
//       //   setLoading(false);
//       // }

//       // try {
//       //   // --- TEMPORARY TEST VARIABLES ---
//       //   // For production, you will need to fetch a list of courses and sessions first, 
//       //   // or pass them in the URL like ?studentID=14744&courseID=2244&sessionID=999
//       //   const testCourseId = "2244"; 
//       //   const testSessionId = "9999"; // Replace with a real session ID if you know one
        
//       //   // STEP 1: Translate the University Student ID from the URL into Qwickly's Internal User ID
//       //   console.log(`Fetching profile for student: ${studentID}`);
//       //   const userProfile = await fetchStudentProfile(studentID);
        
//       //   if (!userProfile || !userProfile.id) {
//       //     setError("Could not find this student in Qwickly.");
//       //     setLoading(false);
//       //     return;
//       //   }

//       //   const internalUserId = Number(userProfile.id);
//       //   console.log(`Found internal Qwickly User ID: ${internalUserId}`);

//       //   // STEP 2: Fetch the attendance record using all 3 required arguments
//       //   const data = await fetchStudentAttendance(testCourseId, testSessionId, internalUserId);
        
//       //   if (data) {
//       //     setAttendanceData(data);
//       //   } else {
//       //     setError("No attendance data found for this specific course and session.");
//       //   }
//       // } catch (err) {
//       //   setError("An error occurred while fetching data.");
//       //   console.error(err);
//       // } finally {
//       //   setLoading(false);
//       // }
//       try {
//         console.log(`Requesting attendance via n8n for student: ${studentID}`);
//         const data = await fetchStudentAttendanceViaN8N(studentID);
        
//         if (data) {
//           setAttendanceData(data);
//         } else {
//           setError("No data returned from n8n.");
//         }
//       } catch (err) {
//         setError("An error occurred while communicating with the server.");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     }
      

//     loadData();
//   }, [studentID]);

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.header}>Student Attendance Report</Text>
      
//       <Text style={styles.subHeader}>
//         Target ID: {studentID ? studentID : "None provided in URL"}
//       </Text>

//       {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
      
//       {error && <Text style={styles.errorText}>{error}</Text>}

//       {/* Render your fetched Qwickly data here */}
//       {attendanceData && !loading && (
//         <View style={styles.card}>
//           <Text style={styles.dataText}>
//             {/* Displaying raw JSON for testing. Format this beautifully later! */}
//             {JSON.stringify(attendanceData, null, 2)}
//           </Text>
//         </View>
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flexGrow: 1, padding: 24, backgroundColor: '#f5f5f5' },
//   header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
//   subHeader: { fontSize: 16, color: '#666', marginBottom: 20 },
//   errorText: { color: 'red', marginTop: 20, fontSize: 16 },
//   card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginTop: 20, elevation: 2 },
//   dataText: { fontFamily: 'monospace', fontSize: 12 }
// });

// // async function fetchStudentProfile(studentID: string): Promise<{ id: string } | null> {
// //   const trimmedStudentID = studentID.trim();

// //   if (!trimmedStudentID) {
// //     return null;
// //   }

// //   const baseUrl = process.env.EXPO_PUBLIC_API_URL;
// //   if (!baseUrl) {
// //     throw new Error('EXPO_PUBLIC_API_URL is not configured.');
// //   }

// //   const response = await fetch(
// //     `${baseUrl.replace(/\/$/, '')}/students/profile?studentID=${encodeURIComponent(trimmedStudentID)}`,
// //   );

// //   if (response.status === 404) {
// //     return null;
// //   }

// //   if (!response.ok) {
// //     throw new Error(`Unable to fetch student profile (${response.status}).`);
// //   }

// //   const profile = await response.json();
// //   const id = profile?.id ?? profile?.user?.id ?? profile?.data?.id;

// //   return id == null ? null : { id: String(id) };
// // }

//master
// import { useRouter } from "expo-router";
// import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { useAuth } from "../context/Auth";
// import { useEffect } from "react";

// export default function HomeScreen() {
//   const router = useRouter();
//   const { isAuthenticated, user, signOut } = useAuth();

//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.replace("/");
//     }
//   }, [isAuthenticated]);

//   if (!isAuthenticated) return null;

//   function comingSoon() {
//     Alert.alert("Coming soon", "This feature isn't built yet.");
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.welcome}>Welcome, {user?.name || "student"}</Text>

//       <TouchableOpacity
//         style={styles.button}
//         onPress={() => router.push("/attendance")}
//       >
//         <Text style={styles.buttonText}>View Attendance</Text>
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.buttonSecondary} onPress={() => {
//         router.push("/lecture");
//       }}>
//         <Text style={styles.buttonSecondaryText}>Scan QR</Text>
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push("/demo")}>
//         <Text style={styles.buttonSecondaryText}>Settings</Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.signOutButton}
//         onPress={() => {
//           signOut();
//           router.replace("/");
//         }}
//       >
//         <Text style={styles.signOutText}>Sign Out</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 12 },
//   welcome: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
//   button: { width: "100%", paddingVertical: 14, borderRadius: 10, alignItems: "center", backgroundColor: "#000000" },
//   buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
//   buttonSecondary: { width: "100%", paddingVertical: 14, borderRadius: 10, alignItems: "center", backgroundColor: "#eeeeee" },
//   buttonSecondaryText: { fontSize: 16, fontWeight: "600" },
//   signOutButton: { marginTop: 20, paddingVertical: 10 },
//   signOutText: { color: "#cc0000", fontSize: 14, fontWeight: "600" },
// });

//Hopefully final version

import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View, Linking } from "react-native";
import { useAuth } from "../context/Auth";
import { useEffect } from "react";

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, signOut } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated]);

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
      <Text style={styles.welcome}>Welcome, {user?.name || "Admin"}</Text>

      {/* Standard App Features */}
      <TouchableOpacity style={styles.button} onPress={() => router.push("/attendance")}>
        <Text style={styles.buttonText}>View Attendance</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push("/lecture")}>
        <Text style={styles.buttonSecondaryText}>Scan QR</Text>
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