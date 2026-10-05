import type {
  AttendanceReportResponse
} from '../services/reportAPI';


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(
  value: string
): string {

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ============================================
// FORMAT DATE
// ============================================

function formatDate(
  value: string | null
): string {

  if (!value) {
    return 'N/A';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'N/A';
  }

  return date.toLocaleDateString(
    'en-MY',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  );
}


// ============================================
// FORMAT TIME
// ============================================

function formatTime(
  value: string | null
): string {

  if (!value) {
    return 'N/A';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'N/A';
  }

  return date.toLocaleTimeString(
    'en-MY',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}


// ============================================
// BUILD REPORT HTML
// ============================================

export function buildAttendanceReportHtml(
  data: AttendanceReportResponse
): string {

  const student =
    data.student;

  const report =
    data.report;

  const attendance =
    data.attendance;


  // ==========================================
  // DISPLAY ATTENDANCE PERCENTAGE
  // ==========================================

  const percentageDisplay =
    attendance.percentage !== null
      ? `${attendance.percentage}%`
      : 'N/A';


  // ==========================================
  // BUILD SESSION ROWS
  // ==========================================

  const sessionRows =
    data.sessions
      .map(
        session => `

          <tr>

            <td>
              ${escapeHtml(
                session.title
              )}
            </td>

            <td>
              ${escapeHtml(
                formatDate(
                  session.startTime
                )
              )}
            </td>

            <td>
              ${escapeHtml(
                formatTime(
                  session.startTime
                )
              )}
            </td>

            <td>
              ${escapeHtml(
                session.status
              )}
            </td>

          </tr>

        `
      )
      .join('');


  // ==========================================
  // RETURN HTML
  // ==========================================

  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<style>

@page {
  size: A4;
  margin: 18mm;
}

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 10.5pt;

  line-height: 1.45;

  color: #000;

}


/* ============================================
   HEADER
============================================ */

.header {

  width: 100%;

  margin-bottom: 30px;

}

.logo-container {

  text-align: right;

}

.logo-placeholder {

  display: inline-block;

  width: 180px;

  height: 55px;

  border: 1px dashed #888;

  text-align: center;

  line-height: 55px;

  font-size: 10px;

  color: #777;

}

.document-info {

  margin-top: 20px;

}

.document-info p {

  margin: 2px 0;

}


/* ============================================
   TITLE
============================================ */

.to-whom {

  margin-top: 30px;

  font-weight: bold;

}

.report-title {

  margin-top: 18px;

  margin-bottom: 25px;

  font-weight: bold;

  text-transform: uppercase;

}


/* ============================================
   STUDENT INFORMATION
============================================ */

.student-table {

  border-collapse: collapse;

  margin-bottom: 25px;

}

.student-table td {

  padding:
    3px
    15px
    3px
    0;

}

.student-table .label {

  width: 130px;

  font-weight: bold;

}


/* ============================================
   OVERALL ATTENDANCE
============================================ */

.attendance-table {

  width: 100%;

  border-collapse: collapse;

  margin-top: 20px;

  margin-bottom: 25px;

}

.attendance-table th,
.attendance-table td {

  border: 1px solid #000;

  padding: 8px;

  text-align: center;

}

.attendance-table th {

  font-weight: bold;

}


/* ============================================
   SUMMARY
============================================ */

.summary-title {

  margin-top: 25px;

  margin-bottom: 10px;

  font-weight: bold;

}

.summary-table {

  width: 65%;

  border-collapse: collapse;

}

.summary-table td {

  border: 1px solid #000;

  padding: 7px 10px;

}

.summary-table .summary-label {

  font-weight: bold;

  width: 65%;

}


/* ============================================
   SESSION RECORDS
============================================ */

.session-section {

  margin-top: 30px;

  page-break-before: auto;

}

.session-title {

  font-weight: bold;

  margin-bottom: 10px;

}

.session-table {

  width: 100%;

  border-collapse: collapse;

}

.session-table th,
.session-table td {

  border: 1px solid #000;

  padding: 6px;

  font-size: 9pt;

}

.session-table th {

  text-align: center;

  font-weight: bold;

}

.session-table td {

  text-align: center;

}

.session-table tr {

  page-break-inside: avoid;

}


/* ============================================
   CLASSIFICATION
============================================ */

.classification {

  margin-top: 30px;

}

.key-table {

  width: 55%;

  border-collapse: collapse;

  margin-top: 10px;

}

.key-table th,
.key-table td {

  border: 1px solid #000;

  padding: 6px 10px;

}

.key-table th {

  text-align: left;

}


/* ============================================
   CLOSING
============================================ */

.closing {

  margin-top: 30px;

}

.signature {

  margin-top: 40px;

}

.footer {

  margin-top: 50px;

  font-size: 9pt;

}


/* ============================================
   PRINT
============================================ */

thead {

  display: table-header-group;

}

tfoot {

  display: table-footer-group;

}

</style>

</head>


<body>


<!-- ==========================================
     HEADER
=========================================== -->

<div class="header">

  <div class="logo-container">

    <div class="logo-placeholder">

      SWINBURNE LOGO

    </div>

  </div>


  <div class="document-info">

    <p>

      <strong>Ref:</strong>

      ${escapeHtml(
        report.reference
      )}

    </p>


    <p>

      <strong>Date:</strong>

      ${escapeHtml(
        report.date
      )}

    </p>

  </div>

</div>


<!-- ==========================================
     TITLE
=========================================== -->

<div class="to-whom">

  TO WHOM IT MAY CONCERN

</div>


<div class="report-title">

  ATTENDANCE REPORT FOR
  ${escapeHtml(
    student.name
  )}

</div>


<!-- ==========================================
     STUDENT DETAILS
=========================================== -->

<table class="student-table">

  <tr>

    <td class="label">
      Student ID
    </td>

    <td>
      :
      ${escapeHtml(
        student.sisId
      )}
    </td>

  </tr>


  <tr>

    <td class="label">
      Student Name
    </td>

    <td>
      :
      ${escapeHtml(
        student.name
      )}
    </td>

  </tr>


  <tr>

    <td class="label">
      Email
    </td>

    <td>
      :
      ${escapeHtml(
        student.email
      )}
    </td>

  </tr>


  <tr>

    <td class="label">
      Programme
    </td>

    <td>
      :
      ${escapeHtml(
        student.programme
      )}
    </td>

  </tr>


  <tr>

    <td class="label">
      Period
    </td>

    <td>
      :
      ${escapeHtml(
        report.period
      )}
    </td>

  </tr>

</table>


<p>

  The attendance record for the above
  student is shown below.

</p>


<!-- ==========================================
     OVERALL ATTENDANCE
=========================================== -->

<table class="attendance-table">

  <thead>

    <tr>

      <th>
        Overall Attendance
      </th>

      <th>
        Percentage
      </th>

      <th>
        Status
      </th>

    </tr>

  </thead>


  <tbody>

    <tr>

      <td>

        ${
          attendance.countedSessions
        }
        counted session${
          attendance.countedSessions === 1
            ? ''
            : 's'
        }

      </td>

      <td>

        ${escapeHtml(
          percentageDisplay
        )}

      </td>

      <td>

        ${escapeHtml(
          attendance.status
        )}

      </td>

    </tr>

  </tbody>

</table>


<!-- ==========================================
     ATTENDANCE SUMMARY
=========================================== -->

<div class="summary-title">

  Attendance Summary

</div>


<table class="summary-table">

  <tr>

    <td class="summary-label">
      Total Sessions
    </td>

    <td>
      ${attendance.totalSessions}
    </td>

  </tr>


  <tr>

    <td class="summary-label">
      Counted Sessions
    </td>

    <td>
      ${attendance.countedSessions}
    </td>

  </tr>


  <tr>

    <td class="summary-label">
      Present
    </td>

    <td>
      ${attendance.present}
    </td>

  </tr>


  <tr>

    <td class="summary-label">
      Absent
    </td>

    <td>
      ${attendance.absent}
    </td>

  </tr>


  <tr>

    <td class="summary-label">
      Excused
    </td>

    <td>
      ${attendance.excused}
    </td>

  </tr>


  <tr>

    <td class="summary-label">
      No Record
    </td>

    <td>
      ${attendance.noRecord}
    </td>

  </tr>

</table>


<!-- ==========================================
     SESSION DETAILS
=========================================== -->

<div class="session-section">

  <div class="session-title">

    Attendance Session Details

  </div>


  <table class="session-table">

    <thead>

      <tr>

        <th>
          Session
        </th>

        <th>
          Date
        </th>

        <th>
          Time
        </th>

        <th>
          Status
        </th>

      </tr>

    </thead>


    <tbody>

      ${
        sessionRows ||
        `
          <tr>

            <td colspan="4">

              No attendance sessions
              are available.

            </td>

          </tr>
        `
      }

    </tbody>

  </table>

</div>


<!-- ==========================================
     CLASSIFICATION
=========================================== -->

<div class="classification">

  <p>

    <strong>
      Attendance Classification:
    </strong>

  </p>


  <table class="key-table">

    <thead>

      <tr>

        <th>
          Attendance
        </th>

        <th>
          Percentage (%)
        </th>

      </tr>

    </thead>


    <tbody>

      <tr>

        <td>
          Good
        </td>

        <td>
          80 - 100
        </td>

      </tr>


      <tr>

        <td>
          Fair
        </td>

        <td>
          40 - 79
        </td>

      </tr>


      <tr>

        <td>
          Poor
        </td>

        <td>
          1 - 39
        </td>

      </tr>


      <tr>

        <td>
          Nil
        </td>

        <td>
          0
        </td>

      </tr>

    </tbody>

  </table>


  ${
    attendance.status ===
    'No Attendance Record'
      ? `

        <p>

          <strong>Note:</strong>

          No counted attendance record
          is currently available for this
          student. Therefore, an attendance
          percentage has not been calculated.

        </p>

      `
      : ''
  }

</div>


<!-- ==========================================
     CLOSING
=========================================== -->

<div class="closing">

  <p>

    This report is generated based on
    attendance information available in
    the Smart Attendance System.

  </p>

</div>


<!-- ==========================================
     SIGNATURE
=========================================== -->

<div class="signature">

  <p>
    Yours sincerely,
  </p>

  <br>
  <br>


  <p>

    <strong>
      ____________________________
    </strong>

    <br>

    Authorised Officer

    <br>

    Swinburne University of Technology
    Sarawak Campus

  </p>

</div>


<!-- ==========================================
     FOOTER
=========================================== -->

<div class="footer">

  <hr>

  <p>

    Swinburne University of Technology
    Sarawak Campus

  </p>

</div>


</body>

</html>
`;
}