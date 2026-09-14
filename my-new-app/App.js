
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

async function fetchData(studentId) {
  try {
    const response = await fetch (`${API_BASE_URL}/attendance/${studentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("Server rejected request. Status:", response.status, "Details:", errorDetails);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    throw error; 
  }
}

async function getAttendance(studentId) {
  return fetchData(studentId); 
}

async function fetchStudent(){
    const response = await fetch(`${API_BASE_URL}/students`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      console.error("Student not found.");
      return[];
    }
    const errorDetails = await response.text();
    console.error("Server rejected request. Status:", response.status, "Details:", errorDetails);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();}


export default function App() {

  const [students, setStudents] = useState ([]);

  const [studentsLoading, setStudentsLoading] = useState(true);

  const [selectedStudentId, setSelectedStudentId] = useState(STUDENT_ID || null);
  
  const [manualId, setManualId] = useState("");

  const [student, setStudent] = useState(null);

  const [attendance, setAttendance] = useState(null);

  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);


  async function loadAttendance(studentId) {

    setLoading(true);

    try {

      const data = await getAttendance(studentId);

      setStudent(data.student);

      setAttendance(data.overallAttendance);

      setUnits(data.units);


    } catch (error) {

      console.error(error);

      Alert.alert(
        "Error",
        "Unable to load attendance."
      );


    } finally {

      setLoading(false);
    }
  }

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

  useEffect(() => {

    if (!selectedStudentId) return;

    loadAttendance(selectedStudentId);
  }, [selectedStudentId]);

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

  function handleManualSubmit() {
    const cleaned = manualId.trim().toUpperCase();
    if (cleaned.length > 0) {
      setSelectedStudentId(cleaned);
    }
  }

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

  return (
    <View style={styles.screen}>

      {studentsLoading ? (

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
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
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>
                Loading attendance...
              </Text>
            </View>

          ) : !student ? (

            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                Couldn't load attendance. Pull to refresh or try again later.
              </Text>
            </View>

          ) : (

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
                <Image 
                  source={require("./src/image/logo-long-full.svg")}
                  style= {styles.logo}
                />
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

              onPress={() => {

                Alert.alert(
                  "QR Scanner",
                  "The QR scanner will be implemented here."
                );

              }}

            >

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









const styles = StyleSheet.create({

  
  
  

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


  
  
  

  header: {
    marginBottom: 20,
  },

  logo: {
    width: 150,
    height: 100,
    resizeMode: "contain",
    marginBottom: 10,
    alignSelf: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },


  
  
  

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