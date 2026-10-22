import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/Auth';
import { getSemesterReport, type SemesterReport } from '../services/semesterReportAPI';
import { generateSemesterPdf, shareSemesterPdf } from '../services/pdfService';
import { displayPercentage } from '../services/semesterCompliance';
export default function AttendanceReportScreen() {
  const { user }=useAuth();
  const [loading,setLoading]=useState(false);
  const [report,setReport]=useState<SemesterReport|null>(null);
  const [pdfUri,setPdfUri]=useState<string|null>(null);
  async function generate(){
    if(!user?.sisId){Alert.alert('Sign in required','SIS ID unavailable');return;}
    setLoading(true);setReport(null);setPdfUri(null);
    try{
      const data=await getSemesterReport({sisId:user.sisId,name:user.name,email:user.email});
      const uri=await generateSemesterPdf(data);
      setReport(data);setPdfUri(uri);
      Alert.alert('PDF ready','Semester report generated. Tap Share / Save PDF.');
    }catch(e){Alert.alert('Report error',e instanceof Error?e.message:'Unknown error');}
    finally{setLoading(false);}
  }
  async function share(){if(!pdfUri)return;try{await shareSemesterPdf(pdfUri);}catch(e){Alert.alert('Sharing error',e instanceof Error?e.message:'Unknown error');}}
  return <ScrollView contentContainerStyle={s.root}>
    <Text style={s.title}>Semester Attendance Report</Text>
    <Text style={s.warning}>FYP DEMO — semester/intake percentages are synthetic until a verified source is connected. The 80% threshold is illustrative.</Text>
    <Text style={s.small}>Signed-in student: {user?.name??'Unknown'} ({user?.sisId??'N/A'})</Text>
    <TouchableOpacity style={s.button} onPress={generate} disabled={loading}>{loading?<ActivityIndicator color="#fff"/>:<Text style={s.buttonText}>Generate Semester PDF</Text>}</TouchableOpacity>
    {report && <>
      <Text style={s.heading}>Attendance by semester</Text>
      {report.attendance.semesters.map((sem,i)=><View style={s.card} key={sem.semesterId}>
        <Text style={s.heading}>{sem.label}</Text><Text>Intake: {sem.intake}</Text>
        <Text style={s.percent}>{displayPercentage(sem.percentage)}</Text>
        <Text>{report.evaluations[i]?.label}</Text>
      </View>)}
      <View style={s.card}><Text style={s.heading}>Visa (Synthetic)</Text>
        <Text>Student type: {report.profile?.studentType??'Unavailable'}</Text>
        <Text>Status: {report.profile?.visa.status??'Unavailable'}</Text>
        <Text>Expiry: {report.profile?.visa.expiryDate??'N/A'}</Text>
      </View>
    </>}
    {!!pdfUri && <TouchableOpacity style={s.outline} onPress={share}><Text style={s.outlineText}>Share / Save PDF</Text></TouchableOpacity>}
  </ScrollView>;
}
const s=StyleSheet.create({root:{padding:24,paddingBottom:50,backgroundColor:'#f7f8fa',flexGrow:1},title:{fontSize:27,fontWeight:'700'},heading:{fontSize:18,fontWeight:'700',marginBottom:8},warning:{backgroundColor:'#fff2cf',padding:13,color:'#7c5600',borderRadius:10,marginVertical:16,lineHeight:19},small:{color:'#64748b',marginVertical:12},button:{backgroundColor:'#111827',padding:16,borderRadius:10,alignItems:'center',marginVertical:16},buttonText:{color:'#fff',fontWeight:'700'},card:{backgroundColor:'#fff',borderRadius:12,padding:18,marginVertical:9,gap:7},percent:{fontSize:32,fontWeight:'700'},outline:{borderWidth:1,borderColor:'#111827',padding:15,borderRadius:10,alignItems:'center',marginTop:15},outlineText:{fontWeight:'700'}});
