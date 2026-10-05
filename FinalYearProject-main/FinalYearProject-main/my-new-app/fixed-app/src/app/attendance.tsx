import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AttendanceResponse,
  getAttendance,
} from '../services/attendanceAPI';

import { useAuth } from '../context/Auth';


export default function AttendanceScreen() {

  const { user } =
    useAuth();

  const [data, setData] =
    useState<AttendanceResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  const loadAttendance =
    useCallback(async () => {

      if (!user?.sisId) {

        setError(
          'Student ID is unavailable.'
        );

        setLoading(false);

        return;
      }

      try {

        setLoading(true);

        setError(null);

        const result =
          await getAttendance(
            user.sisId
          );

        setData(result);

      } catch (err) {

        console.error(
          'Attendance loading error:',
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

    }, [user?.sisId]);


  useEffect(() => {

    loadAttendance();

  }, [loadAttendance]);


  if (loading) {

    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading attendance...
        </Text>
      </View>
    );

  }


  if (error) {

    return (
      <View style={styles.center}>

        <Text style={styles.errorTitle}>
          Unable to load attendance
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadAttendance}
        >
          <Text style={styles.retryText}>
            Try Again
          </Text>
        </TouchableOpacity>

      </View>
    );

  }


  if (!data) {

    return (
      <View style={styles.center}>
        <Text>
          No attendance data available.
        </Text>
      </View>
    );

  }


  const {
    student,
    attendance,
    records,
  } = data;


  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >

      <Text style={styles.title}>
        My Attendance
      </Text>


      <Text style={styles.studentName}>
        {student.name}
      </Text>

      <Text style={styles.studentId}>
        Student ID: {student.sisId}
      </Text>


      {/* Overall Attendance */}

      <View style={styles.mainCard}>

        <Text style={styles.cardLabel}>
          Overall Attendance
        </Text>

        <Text style={styles.percentage}>

          {attendance.percentage !== null
            ? `${attendance.percentage}%`
            : 'N/A'}

        </Text>

        <Text style={styles.status}>
          {attendance.attendanceStatus}
        </Text>

      </View>


      {/* Statistics */}

      <View style={styles.statsRow}>

        <StatBox
          label="Present"
          value={attendance.present}
        />

        <StatBox
          label="Absent"
          value={attendance.absent}
        />

      </View>


      <View style={styles.statsRow}>

        <StatBox
          label="Excused"
          value={attendance.excused}
        />

        <StatBox
          label="No Record"
          value={attendance.noRecord}
        />

      </View>


      <Text style={styles.sectionTitle}>
        Attendance Sessions
      </Text>


      {records.map(record => (

        <View
          key={record.sessionId}
          style={styles.sessionCard}
        >

          <View style={styles.sessionHeader}>

            <Text style={styles.sessionTitle}>
              {record.title}
            </Text>

            <Text style={styles.sessionStatus}>
              {record.status}
            </Text>

          </View>


          <Text style={styles.sessionInfo}>

            {formatDate(
              record.startTime
            )}

          </Text>


          <Text style={styles.sessionInfo}>
            Session ID: {record.sessionId}
          </Text>


          <Text style={styles.sessionInfo}>
            Session Method:
            {' '}
            {record.method ?? 'N/A'}
          </Text>


          {record.attendanceMethod && (

            <Text style={styles.sessionInfo}>
              Attendance Method:
              {' '}
              {record.attendanceMethod}
            </Text>

          )}

        </View>

      ))}


      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadAttendance}
      >

        <Text style={styles.refreshText}>
          Refresh Attendance
        </Text>

      </TouchableOpacity>

    </ScrollView>

  );

}


function StatBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {

  return (

    <View style={styles.statBox}>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>

    </View>

  );

}


function formatDate(
  value: string | null
) {

  if (!value) {
    return 'Date unavailable';
  }

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleString();
}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },

    content: {
      padding: 20,
      paddingBottom: 50,
    },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
    },

    title: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 6,
    },

    studentName: {
      fontSize: 18,
      fontWeight: '600',
    },

    studentId: {
      fontSize: 14,
      marginBottom: 20,
    },

    mainCard: {
      backgroundColor: '#ffffff',
      borderRadius: 14,
      padding: 24,
      marginBottom: 16,
      alignItems: 'center',
    },

    cardLabel: {
      fontSize: 15,
    },

    percentage: {
      fontSize: 46,
      fontWeight: '700',
      marginVertical: 6,
    },

    status: {
      fontSize: 16,
      fontWeight: '600',
    },

    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },

    statBox: {
      flex: 1,
      backgroundColor: '#ffffff',
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
    },

    statValue: {
      fontSize: 24,
      fontWeight: '700',
    },

    statLabel: {
      marginTop: 4,
      fontSize: 13,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginTop: 18,
      marginBottom: 12,
    },

    sessionCard: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },

    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },

    sessionTitle: {
      fontSize: 17,
      fontWeight: '600',
      flex: 1,
    },

    sessionStatus: {
      fontWeight: '600',
    },

    sessionInfo: {
      fontSize: 13,
      marginTop: 3,
    },

    refreshButton: {
      padding: 16,
      borderRadius: 10,
      backgroundColor: '#111111',
      alignItems: 'center',
      marginTop: 12,
    },

    refreshText: {
      color: '#ffffff',
      fontWeight: '600',
    },

    loadingText: {
      marginTop: 12,
    },

    errorTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
    },

    errorText: {
      textAlign: 'center',
      marginBottom: 20,
    },

    retryButton: {
      backgroundColor: '#111111',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },

    retryText: {
      color: '#ffffff',
      fontWeight: '600',
    },

  });