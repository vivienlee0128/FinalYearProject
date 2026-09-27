import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AttendanceResponse,
  getAttendance,
} from "../services/attendanceAPI";

export default function AttendanceScreen() {
  const [data, setData] =
    useState<AttendanceResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");

      const result = await getAttendance();

      setData(result);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attendance"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading Qwickly attendance...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={loadAttendance}
        >
          <Text style={styles.buttonText}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>No attendance data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        {data.course.code}
      </Text>

      <Text style={styles.courseName}>
        {data.course.name}
      </Text>

      <Text style={styles.session}>
        {data.session.date} • {data.session.startTime}
      </Text>

      <Text style={styles.method}>
        Attendance Method: {data.session.attendanceMethod}
      </Text>

      <View style={styles.summary}>

        <View>
          <Text style={styles.number}>
            {data.summary.present}
          </Text>
          <Text>Present</Text>
        </View>

        <View>
          <Text style={styles.number}>
            {data.summary.late}
          </Text>
          <Text>Late</Text>
        </View>

        <View>
          <Text style={styles.number}>
            {data.summary.absent}
          </Text>
          <Text>Absent</Text>
        </View>

      </View>

      <Text style={styles.heading}>
        Student Attendance
      </Text>

      <FlatList
        data={data.attendance}
        keyExtractor={(item) => item.studentId}

        renderItem={({ item }) => (

          <View style={styles.student}>

            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>
                {item.name}
              </Text>

              <Text style={styles.studentId}>
                {item.studentId}
              </Text>
            </View>

            <View>

              <Text style={styles.status}>
                {item.status.toUpperCase()}
              </Text>

              {item.checkInTime && (
                <Text style={styles.time}>
                  {item.checkInTime}
                </Text>
              )}

            </View>

          </View>

        )}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={loadAttendance}
      >
        <Text style={styles.buttonText}>
          Refresh Attendance
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
  },

  courseName: {
    fontSize: 18,
    marginTop: 4,
  },

  session: {
    marginTop: 12,
    fontSize: 15,
  },

  method: {
    marginTop: 4,
    marginBottom: 20,
  },

  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    marginBottom: 20,
  },

  number: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },

  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },

  student: {
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  studentName: {
    fontSize: 16,
    fontWeight: "600",
  },

  studentId: {
    marginTop: 3,
  },

  status: {
    fontWeight: "bold",
  },

  time: {
    marginTop: 4,
    textAlign: "right",
  },

  button: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#222",
    alignItems: "center",
    marginTop: 15,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  error: {
    textAlign: "center",
  },

});