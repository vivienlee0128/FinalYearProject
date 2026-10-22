/**
 * Student semester attendance API (n8n demo v2).
 * Place in: src/services/semesterAttendanceV2API.ts
 * Data from this endpoint is synthetic until the verified Qwickly integration is available.
 */
export type AttendanceSource = 'synthetic' | 'qwickly' | 'unavailable';

export type UnitAttendance = {
  code: string;
  name: string;
  present: number;
  late: number;
  absent: number;
  totalSessions: number;
  percentage: number | null;
  source: AttendanceSource;
};

export type SemesterRecord = {
  semesterId: string;
  label: string;
  academicYear: number;
  term: number;
  intake: string;
  percentage: number | null;
  source: AttendanceSource;
  present: number | null;
  late: number | null;
  absent: number | null;
  totalSessions: number | null;
  units: UnitAttendance[];
};

export type SemesterAttendanceV2 = {
  success: true;
  studentSisId: string;
  source: 'synthetic' | 'qwickly';
  generatedAt: string;
  semesters: SemesterRecord[];
};

function getEndpoint(): string {
  // Prefer an explicit URL so existing EXPO_PUBLIC_N8N_URL settings are not disturbed.
  const explicit = process.env.EXPO_PUBLIC_ATTENDANCE_V2_URL?.trim();
  if (explicit) return explicit;

  const base = process.env.EXPO_PUBLIC_N8N_URL?.trim();
  if (!base) {
    throw new Error(
      'Attendance endpoint not configured. Set EXPO_PUBLIC_ATTENDANCE_V2_URL in .env.'
    );
  }
  // Accept either https://host or https://host/webhook as the base.
  const normalized = base.replace(/\/+$/, '').replace(/\/webhook$/, '');
  return `${normalized}/webhook/attendance-semesters-demo`;
}

export async function getSemesterAttendanceV2(
  sisId: string,
  signal?: AbortSignal
): Promise<SemesterAttendanceV2> {
  const cleanedId = sisId.trim();
  if (!/^\d{6,12}$/.test(cleanedId)) {
    throw new Error('A valid signed-in student SIS ID is required.');
  }

  const endpoint = getEndpoint();
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${endpoint}${separator}sis_id=${encodeURIComponent(cleanedId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Attendance request failed (HTTP ${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object') {
    throw new Error('Attendance API returned an invalid response.');
  }

  const result = payload as Partial<SemesterAttendanceV2> & { error?: string };
  if (result.success !== true || !Array.isArray(result.semesters)) {
    throw new Error(result.error || 'Attendance API returned an invalid semester list.');
  }
  if (String(result.studentSisId) !== cleanedId) {
    throw new Error('Attendance API returned data for a different student.');
  }
  if (
    !result.semesters.every(
      (s) =>
        typeof s.semesterId === 'string' &&
        typeof s.label === 'string' &&
        Array.isArray(s.units) &&
        (s.percentage === null ||
          (typeof s.percentage === 'number' &&
            Number.isFinite(s.percentage) &&
            s.percentage >= 0 &&
            s.percentage <= 100))
    )
  ) {
    throw new Error('Attendance API returned malformed semester data.');
  }
  return result as SemesterAttendanceV2;
}
