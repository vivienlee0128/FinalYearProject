import { n8nBaseUrl } from "./config";

export interface AttendanceStudent {
  studentId: string;
  name: string;
  status: "present" | "late" | "absent";
  checkInTime: string | null;
}

export interface AttendanceResponse {
  course: {
    id: number;
    code: string;
    name: string;
  };

  session: {
    id: number;
    date: string;
    startTime: string;
    attendanceMethod: string;
  };

  attendance: AttendanceStudent[];

  summary: {
    total: number;
    present: number;
    late: number;
    absent: number;
  };
}

export async function getAttendance(): Promise<AttendanceResponse> {
  if (!n8nBaseUrl) {
    throw new Error("EXPO_PUBLIC_N8N_URL is not configured.");
  }

  const url = `${n8nBaseUrl}/webhook/attendance-demo`;

  console.log("[Attendance] Requesting:", url);

  const response = await fetch(url);

  console.log("[Attendance] HTTP:", response.status);

  if (!response.ok) {
    throw new Error(
      `Attendance API returned HTTP ${response.status}`
    );
  }

  return response.json();
}