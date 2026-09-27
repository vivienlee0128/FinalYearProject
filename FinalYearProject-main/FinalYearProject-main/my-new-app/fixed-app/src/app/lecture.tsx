import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../context/Auth';
// import { saveReport } from '../services/reports';
interface Unit { code: string; name: string }
interface Session { id: string; session_token: string; expires_at: string }
interface Student { id: string; name: string; sis_id: string; status: string }
export default function LecturerQRScreen() {
  const { request } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [unit, setUnit] = useState('');
  const [duration, setDuration] = useState(15);
  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const loadUnits = useCallback(async () => {
    setBusy(true); setError('');
    try { const result: Unit[] = await (await request('/units')).json(); setUnits(result); setUnit(result[0]?.code ?? ''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load your classes.'); }
    finally { setBusy(false); }
  }, [request]);
  useEffect(() => { void loadUnits(); }, [loadUnits]);
  const roster = useCallback(async () => {
    if (!session) return;
    try { setStudents(await (await request(`/sessions/${encodeURIComponent(session.id)}/roster`)).json()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not refresh the class list.'); }
  }, [request, session]);
  useEffect(() => {
    if (!session) return;
    void roster();
    const timer = setInterval(() => { setNow(Date.now()); void roster(); }, 5000);
    return () => clearInterval(timer);
  }, [roster, session]);
  async function generate() {
    setBusy(true); setError(''); setStudents([]); setSession(null);
    try { setSession(await (await request('/sessions/create', { method: 'POST', body: JSON.stringify({ unit_code: unit, duration_minutes: duration }) })).json()); setNow(Date.now()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not create the session.'); }
    finally { setBusy(false); }
  }
  async function override(student: Student, status: string) {
    if (!session) return;
    setBusy(true); setError('');
    try { await request(`/sessions/${encodeURIComponent(session.id)}/attendance`, { method: 'PATCH', body: JSON.stringify({ student_id: student.id, status }) }); await roster(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Attendance update failed.'); }
    finally { setBusy(false); }
  }
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Lecturer portal</Text>
    <Text>Local attendance prototype. These sessions do not write to Qwickly.</Text>
    {!!error && <Text accessibilityRole="alert" style={{ color: '#a00000' }}>{error}</Text>}
    {busy && <ActivityIndicator />}
    <TouchableOpacity disabled={busy} onPress={() => void loadUnits()}><Text>Refresh assigned classes</Text></TouchableOpacity>
    {units.map(item => <TouchableOpacity disabled={busy} key={item.code} onPress={() => { setUnit(item.code); setSession(null); setStudents([]); }}>
      <Text style={{ fontWeight: item.code === unit ? 'bold' : 'normal' }}>{item.code} ? {item.name}</Text>
    </TouchableOpacity>)}
    {!units.length && !busy && <Text>No assigned classes available.</Text>}
    <View style={{ flexDirection: 'row', gap: 20 }}>{[5,10,15,30].map(minutes => <TouchableOpacity disabled={busy} key={minutes} onPress={() => setDuration(minutes)}><Text style={{ fontWeight: minutes === duration ? 'bold' : 'normal' }}>{minutes} min</Text></TouchableOpacity>)}</View>
    <TouchableOpacity disabled={busy || !unit} onPress={() => void generate()}><Text>Generate session QR</Text></TouchableOpacity>
    {session && <>
      {new Date(session.expires_at).getTime() > now ? <QRCode value={session.session_token} size={240} /> : <Text>This QR code has expired. Generate a new session.</Text>}
      <Text>Expires: {new Date(session.expires_at).toLocaleTimeString()}</Text>
      <Text>Class list (refreshes every 5 seconds)</Text>
      {students.map(student => <View key={student.id} style={{ gap: 8 }}>
        <Text>{student.name} ? {student.sis_id}: {student.status}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>{['Present','Late','Absent','Excused'].map(status => <TouchableOpacity disabled={busy} key={status} onPress={() => void override(student,status)}><Text>{status}</Text></TouchableOpacity>)}</View>
      </View>)}
    </>}
  </ScrollView>;
}
