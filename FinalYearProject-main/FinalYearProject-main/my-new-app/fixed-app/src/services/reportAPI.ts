import {
  getAttendance,
} from './attendanceAPI';


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

      // TEMPORARY / EMULATED
      programme:
        'Bachelor of Computer Science'

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