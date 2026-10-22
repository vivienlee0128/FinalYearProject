import { getSemesterAttendance, type SemesterAttendance } from './semesterAttendanceAPI';
import { DEMO_THRESHOLD, evaluateSemester, evaluationLabel } from './semesterCompliance';
import { getStudentProfile, type StudentProfile } from './studentProfileAPI';
export interface SemesterReport {
  student: { sisId: string; name: string; email: string };
  generatedAt: string;
  reference: string;
  attendance: SemesterAttendance;
  demoThreshold: number;
  evaluations: { semesterId: string; result: string; label: string }[];
  profile: StudentProfile | null;
  profileError: string | null;
}
export async function getSemesterReport(student: {sisId:string;name:string;email:string}): Promise<SemesterReport> {
  const attendance = await getSemesterAttendance(student.sisId);
  let profile: StudentProfile | null = null;
  let profileError: string | null = null;
  try {
    const candidate = await getStudentProfile(student.sisId);
    if (candidate.sisId !== student.sisId || !candidate.isSynthetic) throw new Error('Synthetic profile identity/source mismatch');
    profile = candidate;
  } catch (e) { profileError = e instanceof Error ? e.message : 'Profile unavailable'; }
  return {
    student, generatedAt: new Date().toISOString(),
    reference: `DEMO-SEM-${student.sisId}-${Date.now()}`,
    attendance, demoThreshold: DEMO_THRESHOLD,
    evaluations: attendance.semesters.map(s => {
      const result = evaluateSemester(s);
      return { semesterId:s.semesterId, result, label:evaluationLabel(result) };
    }),
    profile, profileError,
  };
}
