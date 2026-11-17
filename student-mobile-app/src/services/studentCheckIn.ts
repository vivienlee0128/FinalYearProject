
/**
 * Student QR attendance entry point.
 *
 * DEMO:
 * Calls the FYP demo webhook without creating an official record.
 *
 * QWICKLY:
 * Calls our HTTPS n8n backend. n8n verifies the Microsoft
 * student identity and holds the private Qwickly proxy key.
 *
 * Never put Qwickly secrets inside the mobile application.
 */

import { submitDemoQrAttendance } from './qrAttendanceAPI';
import { studentAttendanceMode } from './studentAttendance';

const LIVE_URL = (
  process.env.EXPO_PUBLIC_STUDENT_CHECKIN_API_URL ?? ''
).trim();

export type StudentCheckInResult = {
  ok: boolean;
  message: string;
  status: string;
  demo: boolean;
  recordedInQwickly: boolean;
  courseCode?: string;
  sessionId?: string;
};

type ServerCheckInResponse = {
  ok?: boolean;
  success?: boolean;
  status?: string;
  message?: string;
  demo?: boolean;
  recordedInQwickly?: boolean;
  courseCode?: string;
  sessionId?: string | number;
  record?: {
    id?: number;
    parent_session?: number;
    user_id?: number;
    status_id?: number;
  };
};

type QrInfo = {
  courseLmsId: string;
  sessionId: string;
};

function validateFypQr(rawQr: string): QrInfo {
  if (rawQr.length > 4096) {
    throw new Error('The scanned QR code is too large.');
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawQr);
  } catch {
    throw new Error(
      'This is not an FYP lecturer attendance QR.'
    );
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid lecturer QR format.');
  }

  const qr = payload as {
    type?: unknown;
    v?: unknown;
    courseLmsId?: unknown;
    sessionId?: unknown;
    proof?: unknown;
  };

  if (
    qr.type !== 'FYP_ATTENDANCE_DEMO' ||
    qr.v !== 1 ||
    typeof qr.courseLmsId !== 'string' ||
    typeof qr.sessionId !== 'string' ||
    typeof qr.proof !== 'string'
  ) {
    throw new Error(
      'Scan the rotating QR shown on the FYP lecturer page.'
    );
  }

  // Local format validation is not attendance verification.
  // n8n must check the QR signature, expiry and replay status.
  return {
    courseLmsId: qr.courseLmsId,
    sessionId: qr.sessionId,
  };
}

async function postToQwicklyBridge(
  rawQr: string,
  sisId: string,
  getAccessToken: () => Promise<string>,
  qrInfo: QrInfo
): Promise<StudentCheckInResult> {
  if (!/^https:\/\//i.test(LIVE_URL)) {
    throw new Error(
      'EXPO_PUBLIC_STUDENT_CHECKIN_API_URL must use HTTPS.'
    );
  }

  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error(
      'Your Microsoft session has expired. Please sign in again.'
    );
  }

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    25000
  );

  try {
    const response = await fetch(LIVE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        qrData: rawQr,
        sisId,
        courseLmsId: qrInfo.courseLmsId,
        sessionId: qrInfo.sessionId,
      }),
      signal: controller.signal,
    });

    const data = (
      await response.json().catch(() => null)
    ) as ServerCheckInResponse | null;

    if (
      !data ||
      typeof data !== 'object' ||
      typeof data.message !== 'string'
    ) {
      throw new Error(
        `Attendance server returned an invalid response ` +
        `(HTTP ${response.status}).`
      );
    }

    const confirmed =
      response.status === 201 &&
      data.ok === true &&
      data.recordedInQwickly === true &&
      typeof data.record?.id === 'number' &&
      typeof data.record?.parent_session === 'number' &&
      data.record?.status_id === 286;

    // Only the confirmed HTTP 201 response from n8n means
    // Qwickly created a new attendance record.
    return {
      ok: confirmed,
      status: String(
        data.status ??
        (confirmed ? 'qwickly_recorded' : 'not_recorded')
      ),
      message: confirmed
        ? data.message
        : data.message ||
          'No new Qwickly attendance record was confirmed.',
      demo: false,
      recordedInQwickly: confirmed,
      courseCode: data.courseCode,
      sessionId:
        data.sessionId == null
          ? undefined
          : String(data.sessionId),
    };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        'The attendance request timed out. Check the ' +
        'lecturer roster before retrying; Qwickly might ' +
        'have accepted the first request.'
      );
    }

    if (error instanceof TypeError) {
      throw new Error(
        'Unable to reach the n8n attendance service.'
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function studentCheckIn(
  rawQr: string,
  sisId: string | null,
  method: 'microsoft' | 'development',
  getAccessToken: () => Promise<string>
): Promise<StudentCheckInResult> {
  if (!sisId || !/^\d{6,12}$/.test(sisId)) {
    throw new Error(
      'A valid student SIS ID is required.'
    );
  }

  if (!rawQr) {
    throw new Error(
      'The scanned QR code is empty.'
    );
  }

  const qrInfo = validateFypQr(rawQr);

  if (method !== 'microsoft') {
    throw new Error(
      'Sign in with your Swinburne Microsoft account ' +
      'to check in.'
    );
  }

  if (LIVE_URL) {
    return postToQwicklyBridge(
      rawQr,
      sisId,
      getAccessToken,
      qrInfo
    );
  }

  if (studentAttendanceMode() === 'demo') {
    const result = await submitDemoQrAttendance(
      rawQr,
      sisId
    );

    return {
      ok: result.ok,
      message: result.message,
      status: result.status,
      demo: result.demo,
      recordedInQwickly: result.recordedInQwickly,
      courseCode: result.courseCode,
      sessionId: result.sessionId,
    };
  }

  throw new Error(
    'QR attendance endpoint is not configured.'
  );
}
