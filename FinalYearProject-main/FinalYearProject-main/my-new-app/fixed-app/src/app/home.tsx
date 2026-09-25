import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/Auth';
export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  if (!user) return null;
  return <View style={styles.container}>
    <Text style={styles.title}>Welcome, {user.name}</Text>
    <Text>{user.role === 'lecturer' ? 'Lecturer portal' : 'Student portal'}</Text>
    {user.role === 'student' ? <>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/attendance')}><Text style={styles.label}>My attendance and visa report</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/qr')}><Text style={styles.label}>Scan QR Code</Text></TouchableOpacity>
    </> : <TouchableOpacity style={styles.button} onPress={() => router.push('/lecture')}><Text style={styles.label}>Class sessions and attendance</Text></TouchableOpacity>}
    <TouchableOpacity onPress={() => void signOut()}><Text>Sign out of this app</Text></TouchableOpacity>
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 24, gap: 20 },
  title: { fontSize: 24, fontWeight: 'bold' }, button: { padding: 16, backgroundColor: '#222', borderRadius: 10 }, label: { color: '#fff' } });
