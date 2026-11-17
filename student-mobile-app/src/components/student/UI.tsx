import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../context/Auth';
import { brand } from '../../constants/brand';
import { studentAttendanceMode } from '../../services/studentAttendance';

type IconName='home'|'scan'|'history'|'profile'|'arrow'|'refresh'|'check'|'alert'|'clock'|'logout'|'shield'|'book';
const paths:Record<IconName,string>={
 home:'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
 scan:'M4 9V4h5 M15 4h5v5 M4 15v5h5 M15 20h5v-5 M8 8h3v3H8z M14 8h3v3h-3z M8 14h3v3H8z M14 14h3 M17 14v3 M14 17h3',
 history:'M7 2h10v4H7z M5 5H3v17h18V5h-2 M7 11h10 M7 15h10 M7 19h7',
 profile:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21v-2a8 8 0 0 1 16 0v2z',
 arrow:'M4 12h16 M14 6l6 6-6 6',
 refresh:'M20 7V3h-4 M4 17v4h4 M20 7a8 8 0 0 0-14-2 M4 17a8 8 0 0 0 14 2',
 check:'M4 12l5 5L20 6',
 alert:'M12 3 2 21h20z M12 9v5 M12 18h.01',
 clock:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2',
 logout:'M10 4H4v16h6 M15 7l5 5-5 5 M9 12h11',
 shield:'M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5z M8 12l3 3 5-6',
 book:'M4 4h7a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4z M14 7a3 3 0 0 1 3-3h4v14h-4a3 3 0 0 0-3 3'
};
export function Icon({name,size=20,color=brand.ink}:{name:IconName;size?:number;color?:string}){
 return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d={paths[name]}/></Svg>;
}
export function BrandLogo({width=76}:{width?:number}){
 return <Image source={require('../../../assets/branding/swinburne-logo.png')} style={{width,height:width*89/176}} resizeMode="contain" accessibilityLabel="Swinburne University of Technology logo"/>;
}
const tabs: {path:'/home'|'/scan'|'/attendance'|'/profile';name:string;icon:IconName}[]=[
 {path:'/home',name:'Home',icon:'home'}, {path:'/scan',name:'Scan QR',icon:'scan'}, {path:'/attendance',name:'Attendance',icon:'history'}, {path:'/profile',name:'Profile',icon:'profile'}
];
export function StudentShell({title,subtitle,children,action,scroll=true}:{title:string;subtitle?:string;children:ReactNode;action?:ReactNode;scroll?:boolean}){
 const router=useRouter();const path=usePathname();const {user}=useAuth();const mode=studentAttendanceMode();
 const content=<><View style={styles.pageHeading}><View style={{flex:1,gap:5}}><Text style={styles.kicker}>STUDENT PORTAL</Text><Text style={styles.title}>{title}</Text>{subtitle?<Text style={styles.subtitle}>{subtitle}</Text>:null}</View>{action}</View>
 {mode==='demo'&&<View style={styles.demo}><View style={styles.demoDot}/><Text style={styles.demoText}>DEMO MODE · Semester data is fictional, not official Qwickly records.</Text></View>}
 {user?.method==='development'&&<View style={styles.demo}><Text style={styles.demoText}>Expo Go preview: Microsoft authentication and QR submissions are disabled.</Text></View>}
 {children}</>;
 return <SafeAreaView edges={['top','bottom']} style={{flex:1,backgroundColor:brand.background}}>
  <View style={styles.header}><BrandLogo/><View style={{width:1,height:30,backgroundColor:brand.line}}/><View style={{flex:1}}><Text style={styles.brand}>Student Attendance</Text><Text style={styles.brandHint}>Swinburne Sarawak · FYP prototype</Text></View><View style={{height:8,width:8,borderRadius:4,backgroundColor:mode==='live'?brand.positive:brand.amber}}/></View>
  {scroll?<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{content}</ScrollView>:<View style={[styles.content,{flex:1,paddingBottom:12}]}>{content}</View>}
  <View style={styles.nav}>{tabs.map(t=>{const active=path===t.path;return <Pressable key={t.path} accessibilityRole="tab" accessibilityState={{selected:active}} onPress={()=>router.navigate(t.path)} style={styles.tab}><View style={[styles.tabIcon,active&&{backgroundColor:brand.redTint}]}><Icon name={t.icon} size={22} color={active?brand.red:brand.muted}/></View><Text style={[styles.tabText,active&&{color:brand.redDark,fontWeight:'900'}]}>{t.name}</Text></Pressable>})}</View>
 </SafeAreaView>;
}
export function Card({children,style}:{children:ReactNode;style?:object}){return <View style={[styles.card,style]}>{children}</View>}
export function SectionTitle({children}:{children:ReactNode}){return <Text style={styles.section}>{children}</Text>}
export function Button({children,onPress,secondary=false,disabled=false,icon}:{children:ReactNode;onPress:()=>void;secondary?:boolean;disabled?:boolean;icon?:IconName}){return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.btn,secondary?styles.btnLight:styles.btnRed,disabled&&{opacity:.5}]}>{icon&&<Icon name={icon} color={secondary?brand.ink:'#fff'} size={19}/>}<Text style={{fontSize:14,fontWeight:'800',color:secondary?brand.ink:'#fff'}}>{children}</Text></Pressable>}
export function ProgressBar({percentage}:{percentage:number|null}){return <View style={{height:8,borderRadius:20,backgroundColor:'#EDF0F4',overflow:'hidden'}}><View style={{backgroundColor:brand.red,height:'100%',width:`${Math.max(0,Math.min(100,percentage??0))}%`}}/></View>}
export function ErrorNotice({message}:{message:string}){return <Card style={{backgroundColor:brand.redTint,borderColor:'#F9CED3'}}><Text style={{color:brand.redDark,fontWeight:'700',fontSize:13,lineHeight:19}}>{message}</Text></Card>}
export const ui={label:{color:brand.muted,fontSize:11,fontWeight:'800' as const},muted:{color:brand.muted,fontSize:13,lineHeight:19},value:{fontSize:29,fontWeight:'900' as const,color:brand.ink},row:{flexDirection:'row' as const,alignItems:'center' as const,justifyContent:'space-between' as const,gap:12}};
const styles=StyleSheet.create({
 header:{height:73,backgroundColor:'#fff',borderBottomColor:brand.line,borderBottomWidth:1,flexDirection:'row',gap:12,alignItems:'center',paddingHorizontal:16},brand:{fontSize:15,color:brand.ink,fontWeight:'900'},brandHint:{fontSize:10,color:brand.muted,marginTop:4},content:{paddingHorizontal:18,paddingTop:22,paddingBottom:32,gap:16,maxWidth:880,width:'100%',alignSelf:'center'},pageHeading:{flexDirection:'row',alignItems:'center',gap:10},kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.3,color:brand.red},title:{fontSize:27,fontWeight:'900',color:brand.ink,letterSpacing:-.8},subtitle:{fontSize:13,color:brand.muted,lineHeight:19},demo:{flexDirection:'row',gap:9,alignItems:'center',padding:11,borderRadius:12,backgroundColor:brand.amberTint},demoDot:{width:7,height:7,borderRadius:4,backgroundColor:brand.amber},demoText:{fontSize:11,color:brand.amber,fontWeight:'700',lineHeight:16,flex:1},card:{backgroundColor:'#fff',borderWidth:1,borderColor:brand.line,borderRadius:17,padding:17,gap:12},section:{fontSize:17,fontWeight:'900',color:brand.ink},btn:{minHeight:49,borderRadius:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,paddingHorizontal:15,paddingVertical:13},btnRed:{backgroundColor:brand.red},btnLight:{backgroundColor:'#fff',borderWidth:1,borderColor:brand.line},nav:{flexDirection:'row',backgroundColor:'#fff',borderTopColor:brand.line,borderTopWidth:1,paddingTop:6,paddingHorizontal:3,paddingBottom:1},tab:{flex:1,alignItems:'center',justifyContent:'center',gap:3,minHeight:58},tabIcon:{paddingHorizontal:13,paddingVertical:4,borderRadius:12},tabText:{fontSize:10,color:brand.muted,fontWeight:'700'}
});
