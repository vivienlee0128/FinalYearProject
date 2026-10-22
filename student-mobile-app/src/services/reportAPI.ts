import {
  getAttendance,
} from './attendanceAPI';
import { getStudentProfile, type StudentProfile } from './studentProfileAPI';


// ============================================
// ATTENDANCE REPORT TYPES
// ============================================

export type AttendanceReportStatus =
  | 'Good'
  | 'Fair'
  | 'Poor'
  | 'Nil'
  | 'No Attendance Record';


export interface AttendanceReportSession {
  sessionId: number;

  title: string;

  startTime: string | null;

  status:
    | 'Present'
    | 'Absent'
    | 'Excused'
    | 'No Record'
    | 'Unknown';

  method: string | null;

  attendanceMethod: string | null;
}


export interface AttendanceReportResponse {

  student: {
    sisId: string;
    qwicklyId: number;
    lmsId: string;
    name: string;
    email: string;

    // Student Profile API is currently unavailable,
    // so keep programme as a temporary/emulated value.
    programme: string;
  };


  report: {
    reference: string;
    date: string;
    period: string;
  };


  attendance: {
    totalSessions: number;
    countedSessions: number;

    present: number;
    absent: number;
    excused: number;
    noRecord: number;

    percentage: number | null;

    status: AttendanceReportStatus;
  };


  sessions: AttendanceReportSession[];

  // Synthetic student profile; never an official visa determination.
  demoProfile: {
    available: boolean;
    programme: string | null;
    studentType: 'DOMESTIC' | 'INTERNATIONAL' | null;
    visa: StudentProfile['visa'] | null;
    error: string | null;
  };

  compliance: {
    threshold: number;
    result: 'INSUFFICIENT_DATA' | 'MEETS_DEMO_THRESHOLD' | 'BELOW_DEMO_THRESHOLD';
    label: string;
    isOfficial: false;
  };
}


// ============================================
// GET ATTENDANCE REPORT
// ============================================

export async function getAttendanceReport(
  sisId: string
): Promise<AttendanceReportResponse> {

  console.log(
    '=============================='
  );

  console.log(
    '[REPORT] Building report for:',
    sisId
  );


  // ==========================================
  // GET REAL QWICKLY ATTENDANCE
  // ==========================================

  const attendanceData =
    await getAttendance(sisId);
  if (attendanceData.student.sisId !== sisId) {
    throw new Error('Qwickly attendance student ID does not match signed-in student');
  }

  // A missing emulator profile must not prevent a real attendance PDF.
  let syntheticProfile: StudentProfile | null = null;
  let profileError: string | null = null;
  try {
    const candidate = await getStudentProfile(sisId);
    if (candidate.sisId !== sisId || !candidate.isSynthetic) {
      throw new Error('Emulated profile identity/source mismatch');
    }
    syntheticProfile = candidate;
  } catch (error) {
    profileError = error instanceof Error ? error.message : 'Profile unavailable';
    console.warn('[REPORT] Synthetic profile unavailable:', profileError);
  }

  // Demonstration threshold ONLY. Not a university/immigration policy.
  const demoThreshold = 80;
  const summary = attendanceData.attendance;
  const validPercentage =
    summary.countedSessions > 0 &&
    typeof summary.percentage === 'number' &&
    Number.isFinite(summary.percentage);
  const complianceResult = !validPercentage
    ? 'INSUFFICIENT_DATA' as const
    : summary.percentage! >= demoThreshold
      ? 'MEETS_DEMO_THRESHOLD' as const
      : 'BELOW_DEMO_THRESHOLD' as const;
  const complianceLabel = complianceResult === 'INSUFFICIENT_DATA'
    ? 'Insufficient Attendance Data'
    : complianceResult === 'MEETS_DEMO_THRESHOLD'
      ? 'Meets Demonstration Threshold'
      : 'Below Demonstration Threshold';


  console.log(
    '[REPORT] Attendance received:',
    attendanceData
  );


  // ==========================================
  // REPORT DATE
  // ==========================================

  const now =
    new Date();

  const reportDate =
    now.toLocaleDateString(
      'en-MY',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    );


  // ==========================================
  // DETERMINE REPORT PERIOD
  // ==========================================

  const validDates =
    attendanceData.records
      .map(record => record.startTime)
      .filter(
        (value): value is string =>
          typeof value === 'string' &&
          value.length > 0
      )
      .map(value => new Date(value))
      .filter(
        date =>
          !Number.isNaN(
            date.getTime()
          )
      )
      .sort(
        (a, b) =>
          a.getTime() -
          b.getTime()
      );


  let reportPeriod =
    'No attendance period available';


  if (validDates.length === 1) {

    reportPeriod =
      formatReportDate(
        validDates[0]
      );

  }

  else if (validDates.length > 1) {

    const firstDate =
      validDates[0];

    const lastDate =
      validDates[
        validDates.length - 1
      ];

    reportPeriod =
      `${formatReportDate(firstDate)} - ` +
      `${formatReportDate(lastDate)}`;

  }


  // ==========================================
  // BUILD REFERENCE NUMBER
  // ==========================================
  //
  // This is an application-generated reference
  // for the prototype report.
  //
  // Replace this with the university's official
  // reference format if one is provided later.
  // ==========================================

  const reference =
    `SAR/ATT/${sisId}/${now.getFullYear()}`;


  // ==========================================
  // BUILD REPORT
  // ==========================================

  const report:
    AttendanceReportResponse = {

    student: {

      sisId:
        attendanceData.student.sisId,

      qwicklyId:
        attendanceData.student.qwicklyId,

      lmsId:
        attendanceData.student.lmsId,

      name:
        attendanceData.student.name,

      email:
        attendanceData.student.email,

      // The programme is synthetic if supplied by the emulator.
      programme:
        syntheticProfile?.programme.name ?? 'Unavailable (emulator)'

    },


    report: {

      reference,

      date:
        reportDate,

      period:
        reportPeriod

    },


    attendance: {

      totalSessions:
        attendanceData.attendance.totalSessions,

      countedSessions:
        attendanceData.attendance.countedSessions,

      present:
        attendanceData.attendance.present,

      absent:
        attendanceData.attendance.absent,

      excused:
        attendanceData.attendance.excused,

      noRecord:
        attendanceData.attendance.noRecord,

      percentage:
        attendanceData.attendance.percentage,

      status:
        attendanceData.attendance.attendanceStatus

    },


    demoProfile: {
      available: syntheticProfile !== null,
      programme: syntheticProfile?.programme.name ?? null,
      studentType: syntheticProfile?.studentType ?? null,
      visa: syntheticProfile?.visa ?? null,
      error: profileError,
    },

    compliance: {
      threshold: demoThreshold,
      result: complianceResult,
      label: complianceLabel,
      isOfficial: false,
    },

    sessions:
      attendanceData.records.map(
        record => ({

          sessionId:
            record.sessionId,

          title:
            record.title,

          startTime:
            record.startTime,

          status:
            record.status,

          method:
            record.method,

          attendanceMethod:
            record.attendanceMethod

        })
      )

  };


  console.log(
    '[REPORT] Report prepared:',
    report
  );

  console.log(
    '=============================='
  );


  return report;
}


// ============================================
// DATE FORMATTER
// ============================================

function formatReportDate(
  date: Date
): string {

  return date.toLocaleDateString(
    'en-MY',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  );
}