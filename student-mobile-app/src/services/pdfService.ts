import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import type { SemesterReport } from './semesterReportAPI';
import { buildSemesterAttendanceReportHtml } from '../utils/attendanceReportHtml';

export async function generateSemesterPdf(report: SemesterReport): Promise<string> {
  const html = buildSemesterAttendanceReportHtml(report);
  const result = await Print.printToFileAsync({ html, base64:true });
  if (!result.base64) throw new Error('PDF Base64 unavailable');
  const folder = FileSystem.cacheDirectory;
  if (!folder) throw new Error('Cache directory unavailable');
  const uri = `${folder}semester_report_${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(uri, result.base64, { encoding:FileSystem.EncodingType.Base64 });
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || (info.size !== undefined && info.size < 100)) throw new Error('PDF could not be saved');
  return uri;
}
export async function shareSemesterPdf(uri:string):Promise<void> {
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is unavailable');
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw new Error('PDF missing; generate it again');
  await Sharing.shareAsync(uri,{mimeType:'application/pdf',dialogTitle:'Semester Attendance Report'});
}
