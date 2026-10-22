import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/Auth';

const KEY_PREFIX = 'smart_attendance_intro_v1_';
const steps = [
  {title: '1. Sign in securely', body: 'Use your university Microsoft account. Attendance requests must be associated with your authenticated student identity.'},
  {title: '2. View attendance by semester', body: 'Check each semester/intake percentage independently. N/A means no verified percentage is available; it does not mean 0% attendance.'},
  {title: '3. Scan a lecturer QR code', body: 'Only scan the QR displayed for your active class session. Until Qwickly write access and validation are approved, QR attendance submission is a prototype, not confirmation of attendance.'},
  {title: '4. Understand visa information', body: 'The current Student Profile API and visa information are simulated. They are NOT government or university visa compliance decisions.'},
  {title: '5. Generate an unofficial statement', body: 'Student PDFs are for personal reference. Only authorised SE/Registrar administrators can prepare administrative reports in the separate web portal.'},
  {title: '6. Protect your university account', body: 'Check your SIS ID before using the app. Never share account tokens or sensitive reports. Sign out on shared devices.'},
];

export function GuideContent({ onDone, buttonLabel = 'Get Started' }: { onDone: () => void; buttonLabel?: string }) {
  return <View style={styles.panel}>
    <Text style={styles.heading}>Welcome to Smart Attendance</Text>
    <Text style={styles.subtitle}>A quick guide to your student app</Text>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.items}>
      {steps.map(step => <View key={step.title} style={styles.step}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
      </View>)}
    </ScrollView>
    <Pressable accessibilityRole="button" onPress={onDone} style={styles.button}>
      <Text style={styles.buttonText}>{buttonLabel}</Text>
    </Pressable>
  </View>;
}

/** Place this immediately after your authenticated Stack inside Navigation.
 * Do not put it outside AuthProvider. Never alter existing sign-in code. */
export default function FirstRunGate() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [checkedKey, setCheckedKey] = useState('');
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const identity = user?.sisId || user?.email || '';
  const key = identity ? `${KEY_PREFIX}${identity.toLowerCase()}` : '';

  useEffect(() => {
    let active = true;
    setVisible(false);
    setCheckedKey('');
    if (isLoading || !isAuthenticated || !key || Platform.OS === 'web') return () => { active = false; };
    setChecking(true);
    SecureStore.getItemAsync(key)
      .then(value => { if (active) setVisible(value !== 'done'); })
      .catch(() => { if (active) setVisible(true); })
      .finally(() => { if (active) { setCheckedKey(key); setChecking(false); } });
    return () => { active = false; };
  }, [isLoading, isAuthenticated, key]);

  async function finish() {
    try {
      await SecureStore.setItemAsync(key, 'done');
      setVisible(false);
    } catch {
      // Keep the guide visible instead of falsely recording first-run completion.
      setChecking(false);
    }
  }

  if (!isAuthenticated || !key || checkedKey !== key || checking) return null;
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => {}}>
    <GuideContent onDone={() => void finish()} />
  </Modal>;
}

const styles = StyleSheet.create({
  panel:{flex:1,paddingTop:56,paddingHorizontal:22,paddingBottom:30,backgroundColor:'#F8FAFC'},
  heading:{fontSize:27,fontWeight:'800',color:'#172554'},subtitle:{color:'#475569',fontSize:15,marginTop:8,marginBottom:16},
  scroll:{flex:1},items:{paddingBottom:18,gap:11},step:{backgroundColor:'#FFFFFF',padding:16,borderRadius:14,borderWidth:1,borderColor:'#E2E8F0'},
  title:{fontSize:16,fontWeight:'700',color:'#1E293B',marginBottom:5},body:{fontSize:14,lineHeight:21,color:'#475569'},
  button:{backgroundColor:'#1D4ED8',padding:16,borderRadius:12,alignItems:'center'},buttonText:{color:'white',fontWeight:'700',fontSize:16}
});
