import type {
  AttendanceReportResponse
} from '../services/reportAPI';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildAttendanceReportHtml(
  data: AttendanceReportResponse
): string {

  const student = data.student;
  const report = data.report;

  const rows = data.attendance
    .map(item => `
      <tr>
        <td>
          ${escapeHtml(item.intake)}
        </td>

        <td>
          ${escapeHtml(item.status)}
        </td>

        <td>
          ${item.percentage}%
        </td>
      </tr>
    `)
    .join('');

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
  margin: 20mm;
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

  font-size: 11pt;
  line-height: 1.5;

  color: #000;
}

/* =========================
   HEADER
========================= */

.header {
  width: 100%;
  margin-bottom: 35px;
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

/* =========================
   TITLE
========================= */

.to-whom {
  margin-top: 35px;
  font-weight: bold;
}

.report-title {
  margin-top: 18px;
  margin-bottom: 25px;

  font-weight: bold;
  text-transform: uppercase;
}

/* =========================
   STUDENT
========================= */

.student-table {
  border-collapse: collapse;
  margin-bottom: 25px;
}

.student-table td {
  padding: 3px 15px 3px 0;
}

.student-table .label {
  width: 120px;
  font-weight: bold;
}

/* =========================
   ATTENDANCE
========================= */

.attendance-table {
  width: 100%;

  border-collapse: collapse;

  margin-top: 20px;
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

/* =========================
   CLASSIFICATION
========================= */

.classification {
  margin-top: 25px;
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

/* =========================
   BOTTOM
========================= */

.closing {
  margin-top: 30px;
}

.signature {
  margin-top: 45px;
}

.footer {
  margin-top: 55px;

  font-size: 9pt;
}

</style>

</head>


<body>


<!-- HEADER -->

<div class="header">

  <div class="logo-container">

    <div class="logo-placeholder">
      SWINBURNE LOGO
    </div>

  </div>


  <div class="document-info">

    <p>
      <strong>Ref:</strong>
      ${escapeHtml(report.reference)}
    </p>

    <p>
      <strong>Date:</strong>
      ${escapeHtml(report.date)}
    </p>

  </div>

</div>


<!-- TITLE -->

<div class="to-whom">
  TO WHOM IT MAY CONCERN
</div>


<div class="report-title">
  ATTENDANCE REPORT FOR
  ${escapeHtml(student.name)}
</div>


<!-- STUDENT DETAILS -->

<table class="student-table">

  <tr>

    <td class="label">
      Student ID
    </td>

    <td>
      : ${escapeHtml(student.sisId)}
    </td>

  </tr>


  <tr>

    <td class="label">
      Programme
    </td>

    <td>
      : ${escapeHtml(student.programme)}
    </td>

  </tr>


  <tr>

    <td class="label">
      Period
    </td>

    <td>
      : ${escapeHtml(report.period)}
    </td>

  </tr>

</table>


<p>
  The attendance record for the above
  student is shown below:
</p>


<!-- ATTENDANCE TABLE -->

<table class="attendance-table">

  <thead>

    <tr>

      <th>
        Intake
      </th>

      <th>
        Overall Attendance
      </th>

      <th>
        Percentages (%)
      </th>

    </tr>

  </thead>


  <tbody>

    ${rows}

  </tbody>

</table>


<!-- CLASSIFICATION -->

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
        <td>Good</td>
        <td>80 - 100</td>
      </tr>

      <tr>
        <td>Fair</td>
        <td>40 - 79</td>
      </tr>

      <tr>
        <td>Poor</td>
        <td>1 - 39</td>
      </tr>

      <tr>
        <td>Nil</td>
        <td>0</td>
      </tr>

    </tbody>

  </table>

</div>


<!-- CLOSING -->

<div class="closing">

  <p>
    This report is generated based on
    attendance information available in
    the Smart Attendance System.
  </p>

</div>


<!-- SIGNATURE -->

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


<!-- FOOTER -->

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