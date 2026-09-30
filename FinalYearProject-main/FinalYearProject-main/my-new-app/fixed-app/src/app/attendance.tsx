import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AttendanceResponse,
  getAttendance,
} from '../services/attendanceAPI';

import { useAuth } from '../context/Auth';

export default function AttendanceScreen() {

  // Get the currently logged-in Microsoft student
  const { user } = useAuth();

  const [data, setData] =
    useState<AttendanceResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  async function loadAttendance() {
    try {
      setLoading(true);
      setError('');

      // Make sure Microsoft login gave us a student/SIS ID
      if (!user?.sisId) {
        throw new Error(
          'Student ID could not be determined from your Microsoft account.'
        );
      }

      console.log(
        '[Attendance] Logged-in student:',
        user.email
      );

      console.log(
        '[Attendance] SIS ID:',
        user.sisId
      );

      // Send THIS student's SIS ID to attendanceAPI
      const result =
        await getAttendance(user.sisId);

      console.log(
        '[Attendance] Result:',
        result
      );

      setData(result);

    } catch (err) {

      console.error(
        '[Attendance] Error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load attendance.'
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.sisId) {
      void loadAttendance();
    } else {
      setLoading(false);
    }
  }, [user?.sisId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text>
          Loading attendance...
        </Text>
      </View>
    );
  }

  if (!user?.sisId) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          Student ID could not be determined
          from your Microsoft account.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>

        <Text style={styles.error}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            void loadAttendance()
          }
        >
          <Text style={styles.buttonText}>
            Try Again
          </Text>
        </TouchableOpacity>

      </View>
    );
  }

  if (!data) {
    return null;
  }

  // Protect the app if n8n returns the wrong structure
  if (
    !data.student ||
    !data.overall ||
    !Array.isArray(data.courses)
  ) {
    return (
      <View style={styles.center}>

        <Text style={styles.error}>
          Invalid attendance data received
          from the server.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            void loadAttendance()
          }
        >
          <Text style={styles.buttonText}>
            Try Again
          </Text>
        </TouchableOpacity>

      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        My Attendance
      </Text>

      <Text style={styles.student}>
        {data.student.name}
      </Text>

      {/* OVERALL */}

      <View style={styles.overallCard}>

        <Text style={styles.percentage}>
          {data.overall.percentage}%
        </Text>

        <Text>
          Overall Attendance
        </Text>

        <View style={styles.summary}>

          <View>
            <Text style={styles.number}>
              {data.overall.present}
            </Text>
            <Text>Present</Text>
          </View>

          <View>
            <Text style={styles.number}>
              {data.overall.late}
            </Text>
            <Text>Late</Text>
          </View>

          <View>
            <Text style={styles.number}>
              {data.overall.absent}
            </Text>
            <Text>Absent</Text>
          </View>

        </View>

      </View>

      <Text style={styles.heading}>
        My Units
      </Text>

      <FlatList
        data={data.courses}

        keyExtractor={(item) =>
          String(item.id)
        }

        renderItem={({ item }) => (

          <View style={styles.course}>

            <View style={styles.courseInfo}>

              <Text style={styles.courseCode}>
                {item.code}
              </Text>

              <Text style={styles.courseName}>
                {item.name}
              </Text>

              <Text style={styles.details}>
                Present {item.present}
                {'  •  '}
                Late {item.late}
                {'  •  '}
                Absent {item.absent}
              </Text>

            </View>

            <Text style={styles.coursePercentage}>
              {item.percentage}%
            </Text>

          </View>

        )}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          void loadAttendance()
        }
      >
        <Text style={styles.buttonText}>
          Refresh
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  student: {
    color: '#666',
    marginTop: 5,
    marginBottom: 20,
  },

  overallCard: {
    padding: 24,
    borderRadius: 15,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    marginBottom: 25,
  },

  percentage: {
    fontSize: 44,
    fontWeight: 'bold',
  },

  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },

  number: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  course: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },

  courseInfo: {
    flex: 1,
  },

  courseCode: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  courseName: {
    marginTop: 3,
  },

  details: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },

  coursePercentage: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  button: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  error: {
    color: '#a00000',
  },
});