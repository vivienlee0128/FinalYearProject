/** Student-owned attendance view. Production API must derive SIS ID from a verified
 * Microsoft bearer token and must NOT trust a student-provided sis_id parameter.
 * No Qwickly client secrets or fake official check-ins live in Expo. */
import type { SemesterAttendanceV2, SemesterRecord } from './semesterAttendanceV2API';
import { getSemesterAttendanceV2 } from './semesterAttendanceV2API';

export type StudentAttendanceData = SemesterAttendanceV2;
export const isStudentDemo = process.env.EXPO_PUBLIC_STUDENT_DEMO_MODE === 'true';
const LIVE_URL = (process.env.EXPO_PUBLIC_STUDENT_ATTENDANCE_API_URL || '').trim();
const DEMO_URL = (process.env.EXPO_PUBLIC_ATTENDANCE_V2_URL || '').trim();

export function studentAttendanceMode(): 'live' | 'demo' | 'unconfigured' {
  return LIVE_URL ? 'live' : isStudentDemo ? 'demo' : 'unconfigured';
}

function validate(data: unknown, sisId: string, requireReal: boolean): StudentAttendanceData {
  if (!data || typeof data !== 'object') throw new Error('Attendance response is invalid.');
  const row = data as Partial<SemesterAttendanceV2>;
  if (row.success !== true || String(row.studentSisId) !== sisId || !Array.isArray(row.semesters)) {
    throw new Error('Attendance response does not match the signed-in student.');
  }
  if (requireReal && row.source !== 'qwickly') throw new Error('The API did not confirm a Qwickly attendance source.');
  if (!['synthetic','qwickly'].includes(String(row.source))) throw new Error('Unknown attendance data source.');
  for (const sem of row.semesters) {
    if (!sem || !Array.isArray(sem.units) || typeof sem.label !== 'string' ||
        (sem.percentage !== null && (typeof sem.percentage !== 'number' || sem.percentage < 0 || sem.percentage > 100))) {
      throw new Error('Attendance response contains invalid semester data.');
    }
    for (const unit of sem.units) {
      if (!unit || typeof unit.code !== 'string' || !Number.isInteger(unit.totalSessions) || unit.totalSessions < 0 ||
          (unit.percentage !== null && (typeof unit.percentage !== 'number' || unit.percentage < 0 || unit.percentage > 100))) {
        throw new Error('Attendance response contains invalid unit data.');
      }
    }
  }
  return row as StudentAttendanceData;
}

function sample(sisId: string): StudentAttendanceData {
  // Intentionally fictional and identical regardless of SIS ID; never imply official records.
  const units: SemesterRecord['units'] = [
    {code:'CSS202',name:'System Analysis and Design',present:11,late:1,absent:2,totalSessions:14,percentage:85.7,source:'synthetic'},
    {code:'CSS203',name:'User Centered Design',present:12,late:0,absent:2,totalSessions:14,percentage:85.7,source:'synthetic'},
    {code:'CSS204',name:'Data Structure',present:10,late:1,absent:3,totalSessions:14,percentage:78.6,source:'synthetic'},
  ];
  return {success:true,studentSisId:sisId,source:'synthetic',generatedAt:new Date().toISOString(),semesters:[
    {semesterId:'DEMO-2026-S2',label:'Semester 2, 2026',academicYear:2026,term:2,intake:'2025',percentage:83.3,source:'synthetic',present:33,late:2,absent:7,totalSessions:42,units},
    {semesterId:'DEMO-2026-S1',label:'Semester 1, 2026',academicYear:2026,term:1,intake:'2025',percentage:91.2,source:'synthetic',present:31,late:0,absent:3,totalSessions:34,units:[
      {code:'CSS201',name:'Programming 2',present:11,late:0,absent:1,totalSessions:12,percentage:91.7,source:'synthetic'},
      {code:'CSS206',name:'IT Security',present:10,late:0,absent:1,totalSessions:11,percentage:90.9,source:'synthetic'},
      {code:'CSS103',name:'Fundamentals of Networking',present:10,late:0,absent:1,totalSessions:11,percentage:90.9,source:'synthetic'},
    ]},
  ]};
}

export async function loadOwnAttendance(
  sisId: string | null | undefined,
  method: 'microsoft' | 'development',
  getAccessToken: () => Promise<string>,
  signal?: AbortSignal,
): Promise<StudentAttendanceData> {
  if (!sisId || !/^\d{6,12}$/.test(sisId)) throw new Error('Your signed-in student SIS ID is unavailable.');
  if (LIVE_URL) {
    if (method !== 'microsoft') throw new Error('Live attendance requires university Microsoft authentication.');
    if (!/^https:\/\//i.test(LIVE_URL)) throw new Error('Use an HTTPS student attendance API.');
    const token = await getAccessToken();
    // Identity and enrolment checks belong to n8n; do not send an unverified SIS ID.
    const response = await fetch(LIVE_URL,{headers:{Accept:'application/json',Authorization:`Bearer ${token}`},signal});
    if (!response.ok) throw new Error(`Attendance server rejected the request (HTTP ${response.status}).`);
    return validate(await response.json(),sisId,true);
  }
  if (isStudentDemo) {
    if (DEMO_URL) {
      const data = await getSemesterAttendanceV2(sisId,signal);
      if (data.source !== 'synthetic') throw new Error('Demo endpoint returned an unexpected non-demo source.');
      return validate(data,sisId,false);
    }
    return sample(sisId);
  }
  throw new Error('Student attendance API is not configured. Ask the project administrator to configure the approved n8n endpoint.');
}

export function summariseAttendance(data: StudentAttendanceData | null) {
  const current = data?.semesters?.[0];
  return {current,percentage:current?.percentage ?? null,units:current?.units ?? [],semesterCount:data?.semesters.length ?? 0};
}
