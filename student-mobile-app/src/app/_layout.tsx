import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { brand } from '../constants/brand';
import { AuthProvider, useAuth } from '../context/Auth';

function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:brand.background}}><ActivityIndicator size="large" color={brand.red}/></View>;
  return <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:brand.background}}}>
    <Stack.Protected guard={!isAuthenticated}><Stack.Screen name="index"/></Stack.Protected>
    <Stack.Protected guard={isAuthenticated}>
      <Stack.Screen name="home"/>
      <Stack.Screen name="scan"/>
      <Stack.Screen name="attendance"/>
      <Stack.Screen name="profile"/>
    </Stack.Protected>
    <Stack.Screen name="auth/callback"/>
  </Stack>;
}
export default function RootLayout(){return <AuthProvider><Navigation/></AuthProvider>}
