import { Text, View } from 'react-native';
export default function StudentRecords() {
  return <View style={{ padding: 24, gap: 16 }}>
    <Text>Student records are provisioned by the university administrator.</Text>
    <Text>Creating arbitrary student records or assigning roles from this app is disabled.</Text>
  </View>;
}
