import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/Auth';
import { saveReport } from '../services/reports';
interface Attendance { source: string; units: { code: string; name: string; attendance: number | null }[] }
export default function AttendanceScreen() {
  const { user, request } = useAuth();
  const [data, setData] = useState<Attendance | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(''); setData(null);
    try { setData(await (await request('/attendance/me')).json()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Attendance could not be loaded.'); }
    finally { setLoading(false); }
  }, [request]);
  useEffect(() => { void load(); }, [load]);
  async function report() {
    setDownloading(true); setError('');
    try { await saveReport(await request('/reports/visa'), 'visa-compliance.pdf', 'application/pdf'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Report download failed.'); }
    finally { setDownloading(false); }
  }
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>My attendance</Text>
    <Text>{user?.name} ? SIS ID: {user?.sisId}</Text>
    {loading && <ActivityIndicator />}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#a00000' }}>{error}</Text>}
    {data && <><Text>Data source: {data.source}</Text>
      {!data.units.length && <Text>No enrolled units were returned.</Text>}
      {data.units.map(unit => <Text key={unit.code}>{unit.code} ? {unit.name}: {unit.attendance == null ? 'Not available' : `${unit.attendance}%`}</Text>)}
    </>}
    <TouchableOpacity disabled={loading} onPress={() => void load()}><Text>Refresh attendance</Text></TouchableOpacity>
    <TouchableOpacity disabled={downloading} onPress={() => void report()}><Text>{downloading ? 'Downloading?' : 'Download visa compliance report (PDF)'}</Text></TouchableOpacity>
    <Text>Official reports are supplied by the university reporting workflow. No sample records are substituted when a service fails.</Text>
  </ScrollView>;
}
