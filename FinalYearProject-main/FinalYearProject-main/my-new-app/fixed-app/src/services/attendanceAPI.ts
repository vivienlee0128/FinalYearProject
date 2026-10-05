export interface AttendanceStudent {
  qwicklyId: number;
  sisId: string;
  lmsId: string;
  name: string;
  email: string;
}

export interface AttendanceSummary {
  totalSessions: number;
  countedSessions: number;

  present: number;
  absent: number;
  excused: number;
  noRecord: number;

  percentage: number | null;

  attendanceStatus:
    | 'Good'
    | 'Fair'
    | 'Poor'
    | 'Nil'
    | 'No Attendance Record';
}

export interface AttendanceRecord {
  sessionId: number;

  title: string;

  startTime: string | null;

  method: string | null;

  groupId: number | null;

  sectionId: number | null;

  recordId: number | null;

  statusId: number | null;

  status:
    | 'Present'
    | 'Absent'
    | 'Excused'
    | 'No Record'
    | 'Unknown';

  points: string | null;

  absence: string | null;

  attendanceMethod: string | null;

  timeCreated: string | null;
}

export interface AttendanceResponse {
  student: AttendanceStudent;

  attendance: AttendanceSummary;

  records: AttendanceRecord[];
}


// ============================================
// N8N URL
// ============================================

const N8N_URL =
  process.env.EXPO_PUBLIC_N8N_URL;


// ============================================
// GET ATTENDANCE
// ============================================

export async function getAttendance(
  sisId: string
): Promise<AttendanceResponse> {

  if (!N8N_URL) {
    throw new Error(
      'EXPO_PUBLIC_N8N_URL is not configured.'
    );
  }


  // ==========================================
  // BUILD URL
  // ==========================================

  const url =
    `${N8N_URL}/webhook/attendance-demo` +
    `?sis_id=${encodeURIComponent(sisId)}`;


  console.log(
    '=============================='
  );

  console.log(
    '[ATTENDANCE] Fetching attendance for:',
    sisId
  );

  console.log(
    '[ATTENDANCE] Request URL:',
    url
  );


  // ==========================================
  // REQUEST
  // ==========================================

  let response: Response;

  try {

    response =
      await fetch(url, {
        method: 'GET',

        headers: {
          Accept: 'application/json',
        },
      });

  } catch (error) {

    console.error(
      '[ATTENDANCE] Network error:',
      error
    );

    throw new Error(
      'Unable to connect to attendance server.'
    );

  }


  console.log(
    '[ATTENDANCE] HTTP Status:',
    response.status
  );

  console.log(
    '[ATTENDANCE] Content-Type:',
    response.headers.get('content-type')
  );


  // ==========================================
  // READ BODY AS TEXT
  // ==========================================

  let responseText = '';

  try {

    responseText =
      await response.text();

  } catch (error) {

    console.error(
      '[ATTENDANCE] Failed to read response:',
      error
    );

    throw new Error(
      'Unable to read attendance server response.'
    );

  }


  console.log(
    '[ATTENDANCE] Response length:',
    responseText.length
  );

  console.log(
    '[ATTENDANCE] Raw response:',
    responseText
  );


  // ==========================================
  // HTTP ERROR
  // ==========================================

  if (!response.ok) {

    console.error(
      '[ATTENDANCE] HTTP error:',
      response.status,
      responseText
    );

    throw new Error(
      `Attendance request failed (${response.status}).`
    );

  }


  // ==========================================
  // EMPTY RESPONSE
  // ==========================================

  if (
    !responseText ||
    responseText.trim().length === 0
  ) {

    console.error(
      '[ATTENDANCE] EMPTY RESPONSE FROM N8N'
    );

    throw new Error(
      'Attendance server returned an empty response.'
    );

  }


  // ==========================================
  // PARSE JSON
  // ==========================================

  let parsedData: unknown;

  try {

    parsedData =
      JSON.parse(responseText);

  } catch (error) {

    console.error(
      '[ATTENDANCE] JSON parse failed.'
    );

    console.error(
      '[ATTENDANCE] Received:',
      responseText
    );

    throw new Error(
      'Attendance server returned invalid JSON.'
    );

  }


  // ==========================================
  // SUPPORT OBJECT OR ARRAY RESPONSE
  // ==========================================

  let result: unknown;

  if (Array.isArray(parsedData)) {

    if (parsedData.length === 0) {

      throw new Error(
        'Attendance server returned an empty result.'
      );

    }

    result =
      parsedData[0];

  } else {

    result =
      parsedData;

  }


  // ==========================================
  // BASIC RESPONSE VALIDATION
  // ==========================================

  if (
    !result ||
    typeof result !== 'object'
  ) {

    console.error(
      '[ATTENDANCE] Invalid result:',
      result
    );

    throw new Error(
      'Invalid attendance response.'
    );

  }


  const attendanceData =
    result as AttendanceResponse;


  if (!attendanceData.student) {

    console.error(
      '[ATTENDANCE] Missing student:',
      attendanceData
    );

    throw new Error(
      'Student information is missing from attendance response.'
    );

  }


  if (!attendanceData.attendance) {

    console.error(
      '[ATTENDANCE] Missing attendance summary:',
      attendanceData
    );

    throw new Error(
      'Attendance summary is missing from server response.'
    );

  }


  if (
    !Array.isArray(
      attendanceData.records
    )
  ) {

    console.error(
      '[ATTENDANCE] Missing attendance records:',
      attendanceData
    );

    throw new Error(
      'Attendance records are missing from server response.'
    );

  }


  // ==========================================
  // SUCCESS
  // ==========================================

  console.log(
    '[ATTENDANCE] Student:',
    attendanceData.student
  );

  console.log(
    '[ATTENDANCE] Summary:',
    attendanceData.attendance
  );

  console.log(
    '[ATTENDANCE] Session records:',
    attendanceData.records.length
  );

  console.log(
    '=============================='
  );


  return attendanceData;
}