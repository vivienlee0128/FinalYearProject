import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function VisaScreen() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Visa & Compliance
      </Text>

      <Text style={styles.notice}>
        Demo Student Profile API data
      </Text>

      <View style={styles.card}>

        <Text style={styles.label}>
          Visa Status
        </Text>

        <Text style={styles.value}>
          ACTIVE
        </Text>

      </View>

      <View style={styles.card}>

        <Text style={styles.label}>
          Visa Expiry
        </Text>

        <Text style={styles.value}>
          15 March 2027
        </Text>

      </View>

      <View style={styles.card}>

        <Text style={styles.label}>
          Overall Attendance
        </Text>

        <Text style={styles.bigValue}>
          87%
        </Text>

      </View>

      <View style={styles.card}>

        <Text style={styles.label}>
          Attendance Compliance
        </Text>

        <Text style={styles.value}>
          Meets Requirement
        </Text>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  notice: {
    color: '#666',
    marginBottom: 25,
  },

  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },

  label: {
    color: '#666',
    marginBottom: 6,
  },

  value: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  bigValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
});