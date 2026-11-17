import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/Auth';
import { brand } from '../constants/brand';
import { Button, Card, Icon, StudentShell, ui } from '../components/student/UI';
import { studentAttendanceMode } from '../services/studentAttendance';

export default function Profile(){
 const router=useRouter();const {user,signOut}=useAuth();const mode=studentAttendanceMode();
 return <StudentShell title="My profile" subtitle="Account details associated with your university sign-in.">
  <Card style={{alignItems:'center',paddingTop:25,paddingBottom:25}}><View style={{width:66,height:66,borderRadius:33,backgroundColor:brand.redTint,alignItems:'center',justifyContent:'center'}}><Icon name="profile" color={brand.red} size={34}/></View><Text style={{fontSize:19,fontWeight:'900',color:brand.ink,textAlign:'center'}}>{user?.name||'Student'}</Text><Text style={{fontSize:13,color:brand.muted,textAlign:'center'}}>{user?.email||''}</Text><Text style={{fontSize:11,color:brand.red,fontWeight:'900'}}>STUDENT ACCOUNT</Text></Card>
  <Card>{[['Student SIS ID',user?.sisId||'Not detected'],['Sign-in method',user?.method==='microsoft'?'Microsoft Entra ID':'Expo Go demo (no SSO)'],['Attendance source',mode==='live'?'Approved n8n / Qwickly API':mode==='demo'?'Fictional demo':'Not configured']].map(([label,value],i)=><View key={label} style={{gap:5}}>{i>0&&<View style={{height:1,backgroundColor:brand.line,marginVertical:6}}/>}<Text style={ui.label}>{label}</Text><Text style={{color:brand.ink,fontWeight:'800',fontSize:14}}>{value}</Text></View>)}</Card>
  <Card><View style={{flexDirection:'row',gap:10,alignItems:'center'}}><Icon name="shield" color={brand.red}/><Text style={{fontWeight:'900',fontSize:14,color:brand.ink}}>Your privacy</Text></View><Text style={ui.muted}>Only your own attendance should be returned. The production n8n server must verify your Microsoft access token and identify your student record itself. This app must never store Qwickly secrets.</Text></Card>
  <Button secondary icon="logout" onPress={()=>{void signOut().then(()=>router.replace('/'))}}>Sign out</Button>
  <Text style={{color:brand.muted,textAlign:'center',fontSize:11}}>Swinburne Sarawak · Academic FYP prototype</Text>
 </StudentShell>
}
