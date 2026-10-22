/** Semester/intake-level demo attendance only. No unit averaging. */
export const SEMESTER_API = 'https://fyp-workflow.swin.click/webhook/semester-attendance-demo';
export type DataSource = 'DEMO_SYNTHETIC' | 'QWICKLY_INTAKE_VERIFIED';
export interface SemesterRecord {
  semesterId: string;
  label: string;
  intake: string;
  startDate: string;
  endDate: string;
  percentage: number | null;
  source: DataSource;
  calculationMethod: string;
}
export interface SemesterAttendance {
  success: boolean;
  student: { sisId: string };
  semesters: SemesterRecord[];
  source: DataSource;
  isSynthetic: boolean;
  message?: string;
}
export async function getSemesterAttendance(sisId: string, signal?: AbortSignal): Promise<SemesterAttendance> {
  if (!/^\d+$/.test(sisId)) throw new Error('Valid SIS ID required');
  const response = await fetch(`${SEMESTER_API}?sis_id=${encodeURIComponent(sisId)}`, { signal });
  if (!response.ok) throw new Error(`Semester API HTTP ${response.status}`);
  const raw = await response.text();
  if (!raw.trim()) throw new Error('Semester API returned an empty response');
  const data = JSON.parse(raw) as SemesterAttendance;
  if (!data.success || !Array.isArray(data.semesters)) throw new Error(data.message ?? 'Invalid semester response');
  if (data.student?.sisId !== sisId) throw new Error('Semester response identity mismatch');
  if (data.source !== 'DEMO_SYNTHETIC' && data.source !== 'QWICKLY_INTAKE_VERIFIED') throw new Error('Unknown attendance source');
  for (const s of data.semesters) {
    if (!s.semesterId || !s.label || !s.intake || s.source !== data.source ||
        (s.percentage !== null && (typeof s.percentage !== 'number' || !Number.isFinite(s.percentage) || s.percentage < 0 || s.percentage > 100))) {
      throw new Error('Invalid semester data');
    }
  }
  return data;
}
