import { Link } from 'expo-router';
import { Text, View } from 'react-native';
export default function Register() {
  return <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16 }}>
    <Text style={{ fontSize: 24 }}>University account required</Text>
    <Text>Use your university Microsoft account. Contact the university administrator if your student or lecturer profile has not been provisioned.</Text>
    <Link href="/">Return to Microsoft sign-in</Link>
  </View>;
}
