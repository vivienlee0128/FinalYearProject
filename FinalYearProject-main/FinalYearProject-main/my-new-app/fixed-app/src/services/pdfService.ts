import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type {
  AttendanceReportResponse
} from './reportAPI';

import {
  buildAttendanceReportHtml
} from '../utils/attendanceReportHtml';


export async function generateAttendancePdf(
  report: AttendanceReportResponse
): Promise<string> {

  console.log(
    '[PDF] Building attendance report...'
  );

  const html =
    buildAttendanceReportHtml(report);

  const result =
    await Print.printToFileAsync({
      html,
      base64: false,
    });

  console.log(
    '[PDF] Generated:',
    result.uri
  );

  return result.uri;
}


export async function shareAttendancePdf(
  uri: string
): Promise<void> {

  const available =
    await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error(
      'File sharing is not available on this device.'
    );
  }

  await Sharing.shareAsync(
    uri,
    {
      mimeType: 'application/pdf',

      UTI: 'com.adobe.pdf',

      dialogTitle:
        'Attendance Report'
    }
  );
}