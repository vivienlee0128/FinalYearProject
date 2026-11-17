import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/Auth';
import { brand } from '../constants/brand';
import { Button, Card, StudentShell, Icon, ui } from '../components/student/UI';
import { studentCheckIn, type StudentCheckInResult } from '../services/studentCheckIn';

type Outcome={type:'success'|'error';message:string;result?:StudentCheckInResult};
export default function Scan(){
 const {user,getAccessToken}=useAuth();
 const [permission,askPermission]=useCameraPermissions();
 const lock=useRef(false);
 const [scanned,setScanned]=useState(false);
 const [busy,setBusy]=useState(false);
 const [outcome,setOutcome]=useState<Outcome|null>(null);
 const reset=()=>{lock.current=false;setScanned(false);setBusy(false);setOutcome(null)};
 async function onScan(event:{data:string;type:string}){
  if(lock.current||event.type!=='qr')return;
  lock.current=true;setScanned(true);setBusy(true);setOutcome(null);
  try{
   if(!user)throw new Error('Please sign in before checking in.');
   const r=await studentCheckIn(event.data,user.sisId,user.method,getAccessToken);
   setOutcome({type:r.ok?'success':'error',message:r.message,result:r});
  }catch(err){setOutcome({type:'error',message:err instanceof Error?err.message:'Could not verify QR attendance.'})}
  finally{setBusy(false)}
 }
 const ok=outcome?.type==='success';
 const inQwickly=ok&&outcome?.result?.recordedInQwickly===true;
 const title=!ok?'Attendance not recorded':inQwickly?'Attendance recorded':'Demo scan accepted';
 return <StudentShell scroll={false} title="Scan attendance" subtitle="Point your camera at the lecturer's active QR code.">
  <View style={{flex:1,minHeight:200}}>
   {!permission?<Card><ActivityIndicator color={brand.red}/><Text style={ui.muted}>Checking camera permission…</Text></Card>:
    !permission.granted?<Card><Text style={{fontSize:17,fontWeight:'900',color:brand.ink}}>Camera access required</Text><Text style={ui.muted}>Allow camera access so the app can scan a lecturer-issued attendance QR code.</Text><Button onPress={()=>void askPermission()}>Allow camera</Button></Card>:
    scanned?<Card style={{alignItems:'center',paddingVertical:28}}>{busy?<><ActivityIndicator size="large" color={brand.red}/><Text style={ui.muted}>Verifying attendance with n8n…</Text></>:<><View style={{backgroundColor:ok?brand.positiveTint:brand.redTint,padding:17,borderRadius:40}}><Icon name={ok?'check':'alert'} size={28} color={ok?brand.positive:brand.red}/></View><Text style={{fontSize:20,fontWeight:'900',color:brand.ink,textAlign:'center'}}>{title}</Text><Text style={{color:brand.muted,textAlign:'center',fontSize:13,lineHeight:21}}>{outcome?.message}</Text>{outcome?.result?.courseCode&&<Text style={ui.muted}>Unit: {outcome.result.courseCode}</Text>}{inQwickly&&<Text style={{fontSize:12,color:brand.positive,textAlign:'center'}}>Recorded in Qwickly.</Text>}{ok&&!inQwickly&&<Text style={{fontSize:12,color:brand.amber,textAlign:'center'}}>FYP demonstration only · No official Qwickly record was created.</Text>}<View style={{width:'100%'}}><Button onPress={reset} icon="scan">Scan another QR</Button></View></>}</Card>:
    <View style={styles.cameraFrame}>
     <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={e=>void onScan(e)}/>
     <View style={styles.overlay} pointerEvents="none"><View style={styles.target}/><Text style={styles.cameraText}>Position QR code inside the frame</Text></View>
    </View>}
  </View>
  <Card><Text style={{fontSize:12,fontWeight:'800',color:brand.ink}}>Signed-in student: {user?.sisId||'Unavailable'}</Text><Text style={ui.muted}>Only the lecturer's rotating attendance QR is accepted. After scanning, the result above tells you whether your attendance was recorded in Qwickly.</Text></Card>
 </StudentShell>
}
const styles=StyleSheet.create({cameraFrame:{flex:1,minHeight:260,backgroundColor:'#121418',borderRadius:18,overflow:'hidden'},overlay:{flex:1,alignItems:'center',justifyContent:'center',gap:15},target:{width:'69%',aspectRatio:1,borderRadius:17,borderWidth:3,borderColor:'#fff',backgroundColor:'#FFFFFF08'},cameraText:{fontSize:12,fontWeight:'800',color:'#fff',backgroundColor:'#111827AA',padding:10,borderRadius:8,overflow:'hidden'}})
