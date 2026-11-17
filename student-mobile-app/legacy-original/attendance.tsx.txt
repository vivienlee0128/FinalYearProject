/** Place in: src/app/attendance.tsx */
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/Auth';
import {
  getSemesterAttendanceV2,
  type SemesterAttendanceV2,
  type SemesterRecord,
  type UnitAttendance,
} from '../services/semesterAttendanceV2API';

const formatPercent = (value: number | null): string =>
  value === null || !Number.isFinite(value) ? 'N/A' : `${value.toFixed(2)}%`;

function AttendanceBar({ percentage }: { percentage: number | null }) {
  if (percentage === null) return null;
  return (
    <View style={styles.barTrack}>
      <View
        style={[styles.barFill, { width: `${Math.max(0, Math.min(100, percentage))}%` }]}
      />
    </View>
  );
}

function UnitCard({ unit }: { unit: UnitAttendance }) {
  return (
    <View style={styles.unitCard}>
      <View style={styles.rowBetween}>
        <View style={styles.unitHeading}>
          <Text style={styles.unitCode}>{unit.code}</Text>
          <Text style={styles.muted}>{unit.name}</Text>
        </View>
        <Text style={styles.unitPercent}>{formatPercent(unit.percentage)}</Text>
      </View>
      <AttendanceBar percentage={unit.percentage} />
      <View style={styles.countsRow}>
        <Text style={styles.countText}>Present: {unit.present}</Text>
        <Text style={styles.countText}>Late: {unit.late}</Text>
        <Text style={styles.countText}>Absent: {unit.absent}</Text>
      </View>
      <Text style={styles.footnote}>
        {unit.totalSessions} recorded sessions · {unit.source === 'synthetic' ? 'Demo data' : unit.source === 'qwickly' ? 'Qwickly data' : 'Unavailable'}
      </Text>
    </View>
  );
}

function SemesterDetail({ semester }: { semester: SemesterRecord }) {
  return (
    <>
      <View style={styles.summaryCard}>
        <Text style={styles.sectionEyebrow}>SEMESTER SUMMARY</Text>
        <Text style={styles.semesterTitle}>{semester.label}</Text>
        <Text style={styles.muted}>Intake: {semester.intake}</Text>
        <Text style={styles.bigPercent}>{formatPercent(semester.percentage)}</Text>
        <AttendanceBar percentage={semester.percentage} />
        <Text style={styles.footnote}>
          {semester.percentage === null
            ? 'No attendance percentage available for this semester.'
            : semester.source === 'synthetic'
              ? 'Synthetic demonstration percentage — not an official attendance result.'
              : 'Attendance percentage returned by the connected source.'}
        </Text>
        {semester.totalSessions !== null && (
          <View style={styles.countsRow}>
            <Text style={styles.countText}>Present: {semester.present ?? 0}</Text>
            <Text style={styles.countText}>Late: {semester.late ?? 0}</Text>
            <Text style={styles.countText}>Absent: {semester.absent ?? 0}</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Attendance by Unit ({semester.units.length})</Text>
      {semester.units.length > 0 ? (
        semester.units.map((unit) => <UnitCard key={unit.code} unit={unit} />)
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No unit-level records available</Text>
          <Text style={styles.muted}>
            The current data source has not supplied individual unit attendance for this semester.
          </Text>
        </View>
      )}
    </>
  );
}

export default function AttendanceScreen() {
  const { user } = useAuth();
  const sisId = user?.sisId ?? '';
  const [data, setData] = useState<SemesterAttendanceV2 | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!sisId) {
      setData(null);
      setLoading(false);
      setError('Sign in to view your attendance.');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getSemesterAttendanceV2(sisId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        const sorted = [...result.semesters].sort(
          (a, b) => b.academicYear - a.academicYear || b.term - a.term
        );
        setData({ ...result, semesters: sorted });
        setSelectedId((previous) =>
          previous && sorted.some((s) => s.semesterId === previous)
            ? previous
            : sorted[0]?.semesterId ?? null
        );
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Unable to load attendance.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [sisId, retry]);

  const selected = data?.semesters.find((s) => s.semesterId === selectedId);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.root}>
      <Text style={styles.title}>My Attendance</Text>
      <Text style={styles.muted}>Review your attendance by academic semester and unit.</Text>
      <View style={styles.warningCard}>
        <Text style={styles.warningText}>
          DEMO DATA: Attendance figures are synthetic until verified Qwickly records are connected.
          Do not use these values for official academic or visa decisions.
        </Text>
      </View>
      <Text style={styles.sisLabel}>Signed-in SIS ID: {sisId || 'Unavailable'}</Text>

      <Text style={styles.selectorLabel}>Select semester</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Choose academic semester"
        accessibilityState={{ expanded: dropdownOpen, disabled: loading || !data?.semesters.length }}
        style={styles.selector}
        disabled={loading || !data?.semesters.length}
        onPress={() => setDropdownOpen((v) => !v)}
      >
        <Text style={styles.selectorText}>{selected?.label ?? 'No semester selected'}</Text>
        <Text style={styles.chevron}>{dropdownOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {dropdownOpen && data && (
        <View style={styles.dropdown}>
          {data.semesters.map((semester) => (
            <TouchableOpacity
              key={semester.semesterId}
              accessibilityRole="button"
              style={[styles.dropdownOption, semester.semesterId === selectedId && styles.optionSelected]}
              onPress={() => {
                setSelectedId(semester.semesterId);
                setDropdownOpen(false);
              }}
            >
              <Text style={styles.optionLabel}>{semester.label}</Text>
              <Text style={styles.optionPercent}>{formatPercent(semester.percentage)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading && <ActivityIndicator size="large" style={styles.loading} />}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!loading && !error && selected && <SemesterDetail semester={selected} />}
      {!loading && !error && data?.semesters.length === 0 && (
        <Text style={styles.muted}>No semester data is available.</Text>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.refreshButton, loading && styles.disabled]}
        disabled={loading}
        onPress={() => {
          setDropdownOpen(false);
          setRetry((value) => value + 1);
        }}
      >
        <Text style={styles.refreshText}>{loading ? 'Loading...' : 'Refresh attendance'}</Text>
      </TouchableOpacity>
      {data?.generatedAt && (
        <Text style={styles.footer}>Demo data updated: {new Date(data.generatedAt).toLocaleString()}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f8fa' },
  root: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 7 },
  muted: { color: '#64748b', fontSize: 14, lineHeight: 21 },
  warningCard: { backgroundColor: '#fff2cf', borderRadius: 12, padding: 15, marginTop: 20, marginBottom: 16 },
  warningText: { color: '#805b12', lineHeight: 21, fontSize: 13 },
  sisLabel: { color: '#64748b', marginBottom: 22 },
  selectorLabel: { fontWeight: '700', fontSize: 15, color: '#111827', marginBottom: 9 },
  selector: { backgroundColor: '#fff', borderColor: '#d1d5db', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectorText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  chevron: { color: '#64748b', fontSize: 12 },
  dropdown: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginTop: 6, overflow: 'hidden' },
  dropdownOption: { paddingHorizontal: 16, paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
  optionSelected: { backgroundColor: '#f1f5f9' },
  optionLabel: { color: '#111827', fontSize: 14 },
  optionPercent: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  loading: { marginTop: 28 },
  error: { color: '#b91c1c', marginTop: 20, lineHeight: 20 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 22 },
  sectionEyebrow: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  semesterTitle: { color: '#111827', fontSize: 21, fontWeight: '700', marginTop: 10, marginBottom: 5 },
  bigPercent: { color: '#111827', fontSize: 44, fontWeight: '700', marginTop: 18, marginBottom: 12 },
  barTrack: { height: 8, borderRadius: 6, backgroundColor: '#e5e7eb', overflow: 'hidden', marginTop: 9, marginBottom: 11 },
  barFill: { height: 8, borderRadius: 6, backgroundColor: '#8b1e2d' },
  footnote: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 9 },
  countsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  countText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  sectionTitle: { color: '#111827', fontSize: 20, fontWeight: '700', marginTop: 27, marginBottom: 6 },
  unitCard: { backgroundColor: '#fff', borderRadius: 14, padding: 17, marginTop: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  unitHeading: { flex: 1, gap: 4 },
  unitCode: { color: '#111827', fontSize: 17, fontWeight: '700' },
  unitPercent: { color: '#111827', fontSize: 20, fontWeight: '700' },
  emptyCard: { backgroundColor: '#fff', padding: 20, borderRadius: 14, marginTop: 12, gap: 8 },
  emptyTitle: { color: '#111827', fontSize: 15, fontWeight: '700' },
  refreshButton: { backgroundColor: '#111827', borderRadius: 12, alignItems: 'center', padding: 18, marginTop: 28 },
  refreshText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.5 },
  footer: { color: '#94a3b8', fontSize: 11, marginTop: 14, textAlign: 'center' },
});
