import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/Auth';
import { loadOwnAttendance, type StudentAttendanceData } from '../services/studentAttendance';
export function useStudentAttendance(){
 const {user,getAccessToken}=useAuth();
 const [data,setData]=useState<StudentAttendanceData|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [refreshKey,setRefreshKey]=useState(0);
 const refresh=useCallback(()=>setRefreshKey(k=>k+1),[]);
 useEffect(()=>{
  const ctrl=new AbortController();let live=true;
  setLoading(true);setError('');setData(null);
  if (!user){setLoading(false);return()=>ctrl.abort();}
  loadOwnAttendance(user.sisId,user.method,getAccessToken,ctrl.signal).then(v=>{if(live)setData(v)}).catch(e=>{if(live&&!ctrl.signal.aborted)setError(e instanceof Error?e.message:'Could not load attendance')}).finally(()=>{if(live)setLoading(false)});
  return()=>{live=false;ctrl.abort()};
 },[user?.sisId,user?.method,getAccessToken,refreshKey]);
 return {data,loading,error,refresh};
}
