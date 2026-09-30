import { n8nBaseUrl } from './config';

export interface CourseAttendance {
  id: number;
  code: string;
  name: string;

  percentage: number;

  present: number;
  late: number;
  absent: number;
}

export interface AttendanceResponse {
  student: {
    studentId: string;
    name: string;
    sisId: string;
  };

  overall: {
    percentage: number;
    present: number;
    late: number;
    absent: number;
  };

  courses: CourseAttendance[];
}

export async function getAttendance(sisId: string):
  Promise<AttendanceResponse> {

  if (!n8nBaseUrl) {
    throw new Error(
      'EXPO_PUBLIC_N8N_URL is not configured.'
    );
  }

  const url =
    `${n8nBaseUrl}/webhook/attendance-demo` + `?sis_id=${encodeURIComponent(sisId)}`;

  console.log(
    '[Attendance] Requesting:',
    url
  );

  const response = await fetch(url);

  console.log(
    '[Attendance] HTTP:',
    response.status
  );

  if (!response.ok) {
    throw new Error(
      `Attendance API returned HTTP ${response.status}`
    );
  }

  return response.json();
}