import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useStudentAttendance } from '../hooks/useStudentAttendance';
import { brand } from '../constants/brand';
import { Button, Card, ErrorNotice, Icon, ProgressBar, SectionTitle, StudentShell, ui } from '../components/student/UI';

export default function Attendance(){
 const {data,loading,error,refresh}=useStudentAttendance();
 const [selected,setSelected]=useState<string|null>(null);
 const semesters=data?.semesters||[];
 const current=semesters.find(s=>s.semesterId===(selected||semesters[0]?.semesterId))||semesters[0];
 return <StudentShell title="My attendance" subtitle="Your attendance by semester and enrolled unit." action={<Pressable onPress={refresh} style={{backgroundColor:'#fff',padding:10,borderRadius:12}} accessibilityLabel="Refresh attendance"><Icon name="refresh" color={brand.red}/></Pressable>}>
  {loading&&<ActivityIndicator color={brand.red}/>}{!!error&&<ErrorNotice message={error}/>}
  {!!data&&<Text style={{fontWeight:'800',fontSize:12,color:data.source==='synthetic'?brand.amber:brand.positive}}>{data.source==='synthetic'?'SYNTHETIC DEMONSTRATION DATA':'QWICKLY DATA — verify with institution'}</Text>}
  {semesters.length>0&&<>
   <SectionTitle>Choose semester</SectionTitle>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:9}}>{semesters.map(s=><Pressable key={s.semesterId} onPress={()=>setSelected(s.semesterId)} style={{paddingHorizontal:12,paddingVertical:10,borderRadius:10,backgroundColor:current?.semesterId===s.semesterId?brand.red:'#fff',borderWidth:1,borderColor:current?.semesterId===s.semesterId?brand.red:brand.line}}><Text style={{color:current?.semesterId===s.semesterId?'#fff':brand.ink,fontWeight:'800',fontSize:12}}>{s.label}</Text></Pressable>)}</View>
   {!!current&&<>
    <Card><Text style={ui.label}>SEMESTER ATTENDANCE</Text><View style={ui.row}><Text style={{fontSize:38,fontWeight:'900',color:brand.ink}}>{current.percentage===null?'N/A':`${current.percentage.toFixed(1)}%`}</Text><Text style={ui.muted}>{current.units.length} units</Text></View><ProgressBar percentage={current.percentage}/><View style={{flexDirection:'row',justifyContent:'space-between',gap:8}}>{[['Present',current.present],['Late',current.late],['Absent',current.absent]].map(([label,count])=><View key={String(label)}><Text style={ui.label}>{label}</Text><Text style={{fontWeight:'900',fontSize:19,color:brand.ink}}>{count??'—'}</Text></View>)}</View></Card>
    <SectionTitle>Enrolled units</SectionTitle>
    {current.units.map((unit,i)=><Card key={`${unit.code}-${i}`}><View style={ui.row}><View style={{flex:1}}><Text style={{color:brand.ink,fontWeight:'900',fontSize:16}}>{unit.code}</Text><Text style={ui.muted}>{unit.name}</Text></View><Text style={{fontSize:21,fontWeight:'900',color:brand.ink}}>{unit.percentage===null?'N/A':`${unit.percentage.toFixed(1)}%`}</Text></View><ProgressBar percentage={unit.percentage}/><View style={{flexDirection:'row',justifyContent:'space-between',gap:8}}><Text style={ui.muted}>Present: {unit.present}</Text><Text style={ui.muted}>Late: {unit.late}</Text><Text style={ui.muted}>Absent: {unit.absent}</Text></View><Text style={ui.muted}>{unit.totalSessions} recorded sessions</Text></Card>)}
   </>}
  </>}
  {!loading&&!semesters.length&&<Card><Text style={ui.muted}>No semester attendance records available.</Text><Button secondary onPress={refresh} icon="refresh">Retry</Button></Card>}
  <Text style={{fontSize:11,color:brand.muted,lineHeight:18}}>Attendance percentages follow the configured n8n data source. Demo percentages are fictional; official attendance remains in Qwickly.</Text>
 </StudentShell>
}
