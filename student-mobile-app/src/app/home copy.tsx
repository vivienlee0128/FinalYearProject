import { useRouter } from 'expo-router';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../context/Auth';

export default function HomeScreen() {
  const router = useRouter();

  const {
    user,
    signOut,
  } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>

      <Text style={styles.welcome}>
        Welcome,
      </Text>

      <Text style={styles.name}>
        {user.name}
      </Text>

      <Text style={styles.email}>
        {user.email}
      </Text>

      <Text style={styles.heading}>
        Student Portal
      </Text>

      {/* ATTENDANCE */}

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push('/attendance')
        }
      >
        <Text style={styles.cardTitle}>
          My Attendance
        </Text>

        <Text style={styles.cardDescription}>
          View your attendance history and
          attendance percentage.
        </Text>
      </TouchableOpacity>

      {/* QR */}

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push('/qr')
        }
      >
        <Text style={styles.cardTitle}>
          Scan Attendance QR
        </Text>

        <Text style={styles.cardDescription}>
          Scan the QR code displayed by your
          lecturer to record attendance.
        </Text>
      </TouchableOpacity>

      {/* VISA */}

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push('/visa')
        }
      >
        <Text style={styles.cardTitle}>
          Visa & Compliance
        </Text>

        <Text style={styles.cardDescription}>
          View your visa information and
          attendance compliance status.
        </Text>
      </TouchableOpacity>
      {/* ATTENDANCE REPORT */}

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push('/attendance-report')
        }
      >
        <Text style={styles.cardTitle}>
          Attendance Report
        </Text>

        <Text style={styles.cardDescription}>
          Generate and save your attendance
          report as a PDF document.
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.signOut}
        onPress={() => void signOut()}
      >
        <Text style={styles.signOutText}>
          Sign Out
        </Text>
      </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            router.push('/scan')
          }
        >
          <Text style={styles.cardTitle}>
            Scan QR Code
          </Text>

          <Text style={styles.cardDescription}>
            Scan a QR code to perform a specific action.
          </Text>
        </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#ffffff',
  },

  welcome: {
    fontSize: 16,
    color: '#666',
  },

  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },

  email: {
    color: '#666',
    marginTop: 4,
    marginBottom: 30,
  },

  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  card: {
    padding: 20,
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  cardDescription: {
    marginTop: 6,
    color: '#555',
    lineHeight: 20,
  },

  signOut: {
    marginTop: 'auto',
    padding: 16,
    alignItems: 'center',
  },

  signOutText: {
    color: '#a00000',
    fontWeight: '600',
  },
});