import type { SemesterRecord } from './semesterAttendanceAPI';
/** The threshold is a demo-only configurable example, NOT university policy. */
export const DEMO_THRESHOLD = 80;
export type Evaluation = 'INSUFFICIENT_DATA' | 'MEETS_DEMO_THRESHOLD' | 'BELOW_DEMO_THRESHOLD';
export function evaluateSemester(record: SemesterRecord, threshold = DEMO_THRESHOLD): Evaluation {
  if (record.percentage === null) return 'INSUFFICIENT_DATA';
  return record.percentage >= threshold ? 'MEETS_DEMO_THRESHOLD' : 'BELOW_DEMO_THRESHOLD';
}
export function evaluationLabel(result: Evaluation): string {
  switch (result) {
    case 'INSUFFICIENT_DATA': return 'Insufficient Data';
    case 'MEETS_DEMO_THRESHOLD': return 'Meets Demo Threshold';
    case 'BELOW_DEMO_THRESHOLD': return 'Below Demo Threshold';
  }
}
export function displayPercentage(p: number | null): string { return p === null ? 'N/A' : `${p.toFixed(2)}%`; }
