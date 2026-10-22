import type { SemesterReport } from '../services/semesterReportAPI';
import { displayPercentage } from '../services/semesterCompliance';

function escapeHtml(value: unknown): string {
  return String(value ?? 'N/A')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function dateDisplay(value: string | null | undefined): string {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return escapeHtml(value);
  return parsed.toLocaleDateString('en-MY', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

/** Preserves the original A4 letter layout while using semester/intake data. */
export function buildSemesterAttendanceReportHtml(data: SemesterReport): string {
  const { student, attendance, profile } = data;
  const generatedDate = dateDisplay(data.generatedAt);
  const semesterRows = attendance.semesters.map((semester, index) => `
    <tr>
      <td>${escapeHtml(semester.label)}</td>
      <td>${escapeHtml(semester.intake)}</td>
      <td>${escapeHtml(displayPercentage(semester.percentage))}</td>
      <td>${escapeHtml(data.evaluations[index]?.label ?? 'Not evaluated')}</td>
    </tr>
  `).join('');
  const period = attendance.semesters.length
    ? `${attendance.semesters[0].intake} - ${attendance.semesters[attendance.semesters.length - 1].intake}`
    : 'No semester information available';
  const visa = profile?.visa;
  const visaStatus = !visa ? 'Unavailable'
    : visa.applicable ? visa.status : 'Not Applicable';
  const visaExpiry = visa?.applicable ? dateDisplay(visa.expiryDate) : 'N/A';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
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


/* Semester redesign: additive rules only; original letter styles retained */
.attendance-table td:first-child { text-align: left; }
.notice { border: 1px solid #000; padding: 10px 12px; margin: 18px 0; font-size: 9pt; line-height: 1.4; }
.meta-note { font-size: 9pt; margin: 8px 0 15px; }
.section-heading { font-weight: bold; margin: 22px 0 8px; }
.footer { page-break-inside: avoid; }
.signature { page-break-inside: avoid; }
@media print { tr { page-break-inside: avoid; } }

</style>
</head>
<body>
  <div class="header">
    <div class="logo-container"><div class="logo-placeholder">SWINBURNE LOGO</div></div>
    <div class="document-info">
      <p><strong>Ref:</strong> ${escapeHtml(data.reference)}</p>
      <p><strong>Date:</strong> ${escapeHtml(generatedDate)}</p>
    </div>
  </div>

  <div class="to-whom">TO WHOM IT MAY CONCERN</div>
  <div class="report-title">ATTENDANCE REPORT FOR ${escapeHtml(student.name)}</div>

  <div class="notice">
    <strong>FYP DEMONSTRATION ONLY — NOT AN OFFICIAL UNIVERSITY DOCUMENT.</strong>
    Semester/intake percentages are synthetic demonstration values until the actual
    Qwickly intake percentage source is confirmed. The ${escapeHtml(data.demoThreshold)}%
    threshold is an illustrative demonstration rule, not a verified university or
    immigration requirement. Visa details, when available, are also synthetic.
  </div>

  <table class="student-table">
    <tr><td class="label">Student ID</td><td>: ${escapeHtml(student.sisId)}</td></tr>
    <tr><td class="label">Student Name</td><td>: ${escapeHtml(student.name)}</td></tr>
    <tr><td class="label">Email</td><td>: ${escapeHtml(student.email)}</td></tr>
    <tr><td class="label">Programme</td><td>: ${escapeHtml(profile?.programme?.name ?? 'Unavailable (profile emulator)')}</td></tr>
    <tr><td class="label">Period</td><td>: ${escapeHtml(period)}</td></tr>
  </table>

  <p>The semester/intake attendance record for the above student is shown below.</p>

  <div class="section-heading">Attendance by Semester / Intake</div>
  <table class="attendance-table">
    <thead><tr>
      <th>Semester</th><th>Intake</th><th>Percentage</th><th>Demo Evaluation</th>
    </tr></thead>
    <tbody>${semesterRows || '<tr><td colspan="4">No semester records are available.</td></tr>'}</tbody>
  </table>

  <div class="summary-title">Attendance Summary</div>
  <table class="summary-table">
    <tr><td class="summary-label">Semesters Listed</td><td>${attendance.semesters.length}</td></tr>
    <tr><td class="summary-label">Attendance Source</td><td>${escapeHtml(attendance.source)}</td></tr>
    <tr><td class="summary-label">Overall Percentage</td><td>Not calculated</td></tr>
  </table>
  <p class="meta-note">Each percentage is shown for its own semester/intake. No average across units or semesters is calculated. N/A indicates missing data, not zero attendance.</p>

  <div class="classification">
    <p><strong>Attendance Classification (Illustrative Demo Only):</strong></p>
    <table class="key-table">
      <thead><tr><th>Demo Classification</th><th>Percentage (%)</th></tr></thead>
      <tbody>
        <tr><td>Meets Demo Threshold</td><td>${escapeHtml(data.demoThreshold)} - 100</td></tr>
        <tr><td>Below Demo Threshold</td><td>Below ${escapeHtml(data.demoThreshold)}</td></tr>
        <tr><td>Insufficient Data</td><td>N/A</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section-heading">Student Profile &amp; Visa (Synthetic)</div>
  <table class="summary-table">
    <tr><td class="summary-label">Student Type</td><td>${escapeHtml(profile?.studentType ?? 'Unavailable')}</td></tr>
    <tr><td class="summary-label">Visa Status</td><td>${escapeHtml(visaStatus)}</td></tr>
    <tr><td class="summary-label">Visa Expiry</td><td>${escapeHtml(visaExpiry)}</td></tr>
    <tr><td class="summary-label">Review Required</td><td>${escapeHtml(visa ? (visa.reviewRequired ? 'Yes' : 'No') : 'Unavailable')}</td></tr>
  </table>
  <p class="meta-note">Visa information is simulated and must not be used to determine immigration compliance.${data.profileError ? ` Profile lookup: ${escapeHtml(data.profileError)}.` : ''}</p>

  <div class="closing"><p>This demonstration report was generated by the Smart Attendance System prototype. It is not a university-issued attendance statement, approval, or compliance certificate.</p></div>
  <div class="signature">
    <p>Yours sincerely,</p>
    <p><strong>Smart Attendance System (FYP Prototype)</strong></p>
    <p>Automated demonstration output — no authorised officer signature</p>
  </div>
  <div class="footer"><hr /><p>Swinburne University of Technology Sarawak Campus — FYP DEMONSTRATION ONLY</p></div>
</body>
</html>`;
}
