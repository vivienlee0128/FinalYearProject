import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuth } from '../context/Auth';
import { useStudentAttendance } from '../hooks/useStudentAttendance';
import { brand } from '../constants/brand';
import { summariseAttendance } from '../services/studentAttendance';
import { Button, Card, ErrorNotice, Icon, ProgressBar, SectionTitle, StudentShell, ui } from '../components/student/UI';

export default function Home(){
 const router=useRouter();const {user}=useAuth();const {data,loading,error,refresh}=useStudentAttendance();
 const {current,percentage,units}=summariseAttendance(data);
 return <StudentShell title={`Hello, ${user?.name?.split(' ')[0]||'Student'}`} subtitle="Scan for class attendance and view your own attendance record." action={<Pressable onPress={refresh} accessibilityLabel="Refresh attendance" style={{padding:10,backgroundColor:'#fff',borderRadius:12}}><Icon name="refresh" color={brand.red}/></Pressable>}>
  {loading&&<ActivityIndicator size="large" color={brand.red}/>}{!!error&&<ErrorNotice message={error}/>}
  <Card style={{backgroundColor:brand.ink,borderColor:brand.ink}}>
   <Text style={{fontSize:11,color:'#FFB8C0',fontWeight:'900',letterSpacing:1}}>YOUR ATTENDANCE</Text>
   <View style={{flexDirection:'row',alignItems:'baseline',gap:11}}><Text style={{fontSize:46,fontWeight:'900',color:'#fff'}}>{percentage===null?'—':`${percentage.toFixed(1)}%`}</Text><Text style={{fontSize:12,color:'#DADCE0',flex:1}}>{current?.label||'No semester loaded'}</Text></View>
   <View style={{height:7,borderRadius:9,backgroundColor:'#4E5054',overflow:'hidden'}}><View style={{height:'100%',backgroundColor:brand.red,width:`${Math.max(0,Math.min(100,percentage??0))}%`}}/></View>
   <Text style={{fontSize:11,color:'#CFD2D9'}}>Your personal attendance summary · {data?.source==='synthetic'?'DEMO, not official':'Qwickly when verified'}</Text>
  </Card>
  <Button onPress={()=>router.push('/scan')} icon="scan">Scan lecturer QR code</Button>
  <View style={{flexDirection:'row',gap:10}}>
   <Card style={{flex:1}}><Text style={ui.label}>ENROLLED UNITS</Text><Text style={ui.value}>{units.length||'—'}</Text><Text style={ui.muted}>Current semester</Text></Card>
   <Card style={{flex:1}}><Text style={ui.label}>SESSIONS</Text><Text style={ui.value}>{current?.totalSessions??'—'}</Text><Text style={ui.muted}>Listed attendance sessions</Text></Card>
  </View>
  <View style={ui.row}><SectionTitle>My units</SectionTitle><Pressable onPress={()=>router.push('/attendance')}><Text style={{color:brand.red,fontWeight:'900',fontSize:13}}>See all ›</Text></Pressable></View>
  <Card>{units.length?units.map((unit,i)=><View key={`${unit.code}-${i}`} style={{gap:9}}>{i>0&&<View style={{height:1,backgroundColor:brand.line,marginVertical:4}}/>}<View style={ui.row}><View style={{flex:1}}><Text style={{color:brand.ink,fontWeight:'800',fontSize:14}}>{unit.code}</Text><Text style={ui.muted}>{unit.name}</Text></View><Text style={{fontWeight:'900',fontSize:17,color:brand.ink}}>{unit.percentage===null?'N/A':`${unit.percentage.toFixed(1)}%`}</Text></View><ProgressBar percentage={unit.percentage}/></View>):<Text style={ui.muted}>No enrolled unit attendance data yet. Check the student attendance API configuration.</Text>}</Card>
  <Text style={{fontSize:11,lineHeight:17,color:brand.muted,textAlign:'center'}}>FYP student prototype · Qwickly remains the official attendance authority.</Text>
 </StudentShell>
}
