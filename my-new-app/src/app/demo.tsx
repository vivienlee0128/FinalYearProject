import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function StudentRegisterForm() {
  const [formData, setFormData] = useState({ name: '', sis_id: '', overall_attendance: '' });
  const [loading, setLoading] = useState(false);
  
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

  const handleSubmit = async () => {
    // Basic Validation
    if (!formData.name || !formData.sis_id) {
      Alert.alert('Error', 'Please fill in Name and Student ID (SIS ID).');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/demo`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json' 
        },
        // Send the data exactly as the backend expects it
        body: JSON.stringify({
          name: formData.name,
          sis_id: formData.sis_id,
          // Convert attendance to a number, default to 0 if left blank
          overall_attendance: formData.overall_attendance ? Number(formData.overall_attendance) : 0 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Student added to database successfully!');
        setFormData({ name: '', sis_id: '', overall_attendance: '' }); // Clear form
      } else {
        Alert.alert('Error', result.error || 'Something went wrong.');
      }
    } catch (error) {
        window.alert('Error');
      Alert.alert('Error', 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Register Student</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Student Name</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="e.g., Jane Doe"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Student ID (SIS ID)</Text>
        <TextInput
          style={styles.input}
          value={formData.sis_id}
          onChangeText={(text) => setFormData({ ...formData, sis_id: text })}
          placeholder="e.g., 101234567"
          keyboardType="default"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Initial Attendance Marks (%)</Text>
        <TextInput
          style={styles.input}
          value={formData.overall_attendance}
          onChangeText={(text) => setFormData({ ...formData, overall_attendance: text })}
          placeholder="e.g., 100"
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Student</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1f2937',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});