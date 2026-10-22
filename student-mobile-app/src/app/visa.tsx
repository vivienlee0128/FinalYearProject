import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/Auth';
import { getStudentProfile, type StudentProfile } from '../services/studentProfileAPI';
import { getSemesterAttendance, type SemesterAttendance } from '../services/semesterAttendanceAPI';
import { DEMO_THRESHOLD, displayPercentage, evaluateSemester, evaluationLabel } from '../services/semesterCompliance';
export default function VisaScreen() {
  const { user } = useAuth();
  const sisId = user?.sisId ?? '';
  const [previewInput,setPreviewInput]=useState(sisId);
  const [selectedId,setSelectedId]=useState(sisId);
  const [profile,setProfile]=useState<StudentProfile|null>(null);
  const [attendance,setAttendance]=useState<SemesterAttendance|null>(null);
  const [profileError,setProfileError]=useState('');
  const [attendanceError,setAttendanceError]=useState('');
  const [busy,setBusy]=useState(false);
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{setPreviewInput(sisId);setSelectedId(sisId);},[sisId]);
  useEffect(()=>{
    if(!selectedId){setProfile(null);return;}
    const c=new AbortController();setBusy(true);setProfile(null);setProfileError('');
    getStudentProfile(selectedId,c.signal).then(p=>{if(!c.signal.aborted){if(p.sisId!==selectedId||!p.isSynthetic)throw new Error('Synthetic profile mismatch');setProfile(p);}}).catch(e=>{if(!c.signal.aborted)setProfileError(String(e.message??e));}).finally(()=>{if(!c.signal.aborted)setBusy(false);});
    return ()=>c.abort();
  },[selectedId,refresh]);
  useEffect(()=>{
    if(!sisId){setAttendance(null);return;}
    const c=new AbortController();setAttendance(null);setAttendanceError('');
    getSemesterAttendance(sisId,c.signal).then(a=>{if(!c.signal.aborted)setAttendance(a);}).catch(e=>{if(!c.signal.aborted)setAttendanceError(String(e.message??e));});
    return ()=>c.abort();
  },[sisId,refresh]);
  const switchPreview=()=>{const id=previewInput.trim();if(!/^\d+$/.test(id)){Alert.alert('Invalid SIS ID','Enter a numeric demo SIS ID');return;}setSelectedId(id);};
  return <ScrollView contentContainerStyle={s.root} keyboardShouldPersistTaps="handled">
    <Text style={s.title}>Visa & Semester Compliance</Text>
    <Text style={s.warning}>DEMO ONLY: Visa information and semester percentages are synthetic. The {DEMO_THRESHOLD}% threshold is illustrative, not official policy.</Text>
    <View style={s.card}><Text style={s.heading}>Synthetic Profile Preview</Text>
      <TextInput style={s.input} keyboardType="number-pad" value={previewInput} onChangeText={setPreviewInput} placeholder="104500001"/>
      <TouchableOpacity style={s.button} onPress={switchPreview}><Text style={s.buttonText}>Preview Student</Text></TouchableOpacity>
      <TouchableOpacity style={s.outline} onPress={()=>{setSelectedId(sisId);setPreviewInput(sisId);}}><Text>Use My Profile</Text></TouchableOpacity>
      <Text style={s.small}>Try 104500001–104500500. Preview changes synthetic visa only, never Qwickly identity.</Text>
    </View>
    {busy && <ActivityIndicator/>}{!!profileError && <Text style={s.error}>{profileError}</Text>}
    {profile && <View style={s.card}>
      {selectedId!==sisId && <Text style={s.warning}>PREVIEW STUDENT — DIFFERENT FROM SIGNED-IN STUDENT</Text>}
      <Text style={s.heading}>{profile.fullName}</Text>
      <Text>Student type: {profile.studentType}</Text>
      <Text>Programme (synthetic): {profile.programme.name}</Text>
      <Text>Visa: {profile.visa.applicable?profile.visa.status.replace(/_/g,' '):'Not Applicable'}</Text>
      <Text>Expiry: {profile.visa.expiryDate??'N/A'}</Text>
      <Text>Review: {profile.visa.applicable?(profile.visa.reviewRequired?'Required':'No flag'):'Not Applicable'}</Text>
    </View>}
    <Text style={s.heading}>Semester / Intake Attendance</Text>
    <Text style={s.small}>Always for signed-in student: {sisId}. This section does not switch with the preview.</Text>
    {!!attendanceError && <Text style={s.error}>{attendanceError}</Text>}
    {attendance?.semesters.map(sem=><View style={s.card} key={sem.semesterId}>
      <Text style={s.heading}>{sem.label} — {sem.intake}</Text>
      <Text style={s.percent}>{displayPercentage(sem.percentage)}</Text>
      <Text>{evaluationLabel(evaluateSemester(sem))}</Text>
    </View>)}
    <Text style={s.small}>Compliance is evaluated separately for each semester. No unit-level or cross-semester average is used.</Text>
    <TouchableOpacity style={s.button} onPress={()=>setRefresh(v=>v+1)}><Text style={s.buttonText}>Refresh</Text></TouchableOpacity>
  </ScrollView>;
}
const s=StyleSheet.create({root:{padding:24,paddingBottom:50,backgroundColor:'#f7f8fa',flexGrow:1},title:{fontSize:27,fontWeight:'700'},heading:{fontSize:18,fontWeight:'700',marginBottom:10},warning:{backgroundColor:'#fff2cf',color:'#7c5600',padding:12,borderRadius:9,marginVertical:14,lineHeight:20},card:{backgroundColor:'#fff',borderRadius:13,padding:18,marginVertical:9,gap:7},input:{borderWidth:1,borderColor:'#cbd5e1',padding:12,borderRadius:8},button:{backgroundColor:'#111827',padding:14,borderRadius:10,alignItems:'center',marginTop:10},buttonText:{color:'#fff',fontWeight:'700'},outline:{borderWidth:1,borderColor:'#cbd5e1',padding:12,borderRadius:9,alignItems:'center',marginTop:7},small:{fontSize:12,color:'#64748b',lineHeight:19,marginVertical:8},error:{color:'#b91c1c',margin:10},percent:{fontSize:32,fontWeight:'700'}});
