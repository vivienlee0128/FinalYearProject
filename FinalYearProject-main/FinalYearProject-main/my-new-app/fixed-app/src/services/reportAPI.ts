const n8nBaseUrl =
  process.env.EXPO_PUBLIC_N8N_URL;

export interface AttendanceReportItem {
  intake: string;
  percentage: number;
  status: 'Good' | 'Fair' | 'Poor' | 'Nil';
}

export interface AttendanceReportResponse {
  success: boolean;

  student: {
    sisId: string;
    name: string;
    programme: string;
  };

  report: {
    reference: string;
    date: string;
    period: string;
  };

  attendance: AttendanceReportItem[];
}

export async function getAttendanceReport(
  sisId: string
): Promise<AttendanceReportResponse> {

  if (!n8nBaseUrl) {
    throw new Error(
      'EXPO_PUBLIC_N8N_URL is not configured.'
    );
  }

  const url =
    `${n8nBaseUrl}/webhook/attendance-report` +
    `?sis_id=${encodeURIComponent(sisId)}`;

  console.log('[Report] Requesting:', url);

  const response = await fetch(url);

  console.log(
    '[Report] HTTP:',
    response.status
  );

  if (!response.ok) {
    throw new Error(
      `Report API returned HTTP ${response.status}`
    );
  }

  const data = await response.json();

  console.log(
    '[Report] Response:',
    data
  );

  if (
    !data.success ||
    !data.student ||
    !data.report ||
    !Array.isArray(data.attendance)
  ) {
    throw new Error(
      'Invalid report data received from server.'
    );
  }

  return data;
}