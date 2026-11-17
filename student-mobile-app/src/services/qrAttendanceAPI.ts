/**
 * QR attendance API (n8n webhook).
 * The webhook validates the signed, single-use lecturer QR and, when the workflow
 * is wired to the Qwickly proxy, records attendance in Qwickly.
 * Never send Microsoft access/ID tokens to an unverified webhook.
 *
 * The result flags `demo` and `recordedInQwickly` come from the server. The app
 * only treats a check-in as recorded in Qwickly when the server explicitly says
 * so with `recordedInQwickly: true`.
 */
export type DemoQrResult = {
  ok: boolean;
  status: string;
  message: string;
  demo: boolean;
  recordedInQwickly: boolean;
  courseCode?: string;
  sessionId?: string;
  scannedAt?: string;
};

const endpoint = (process.env.EXPO_PUBLIC_QR_ATTENDANCE_DEMO_URL || '').trim();

export async function submitDemoQrAttendance(
  qrData: string,
  sisId: string,
): Promise<DemoQrResult> {
  if (!endpoint || !/^https:\/\//i.test(endpoint)) {
    throw new Error('Set EXPO_PUBLIC_QR_ATTENDANCE_DEMO_URL to your HTTPS n8n webhook URL.');
  }
  if (!/^\d{7,12}$/.test(sisId)) {
    throw new Error('Your signed-in account does not have a valid student SIS ID.');
  }
  if (!qrData || qrData.length > 4096) {
    throw new Error('QR content is empty or too large.');
  }

  // Only process the QR format created by our n8n issuer.
  let parsed: unknown;
  try {
    parsed = JSON.parse(qrData);
  } catch {
    throw new Error('This is not an FYP attendance QR code.');
  }
  if (
    !parsed || typeof parsed !== 'object' ||
    (parsed as { type?: unknown }).type !== 'FYP_ATTENDANCE_DEMO' ||
    (parsed as { v?: unknown }).v !== 1
  ) {
    throw new Error('Unsupported QR format. Scan the QR shown by the lecturer attendance page.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData, sisId }),
      signal: controller.signal,
    });
    let result: Partial<DemoQrResult>;
    try {
      result = (await response.json()) as Partial<DemoQrResult>;
    } catch {
      throw new Error(`n8n returned a non-JSON response (HTTP ${response.status}).`);
    }
    if (!result || typeof result.ok !== 'boolean' || typeof result.message !== 'string') {
      throw new Error('Unexpected response from the n8n QR workflow.');
    }
    if (!response.ok || !result.ok) {
      return {
        ok: false,
        status: String(result.status ?? 'rejected'),
        message: result.message,
        demo: result.demo === true,
        recordedInQwickly: false,
        courseCode: result.courseCode,
        sessionId: result.sessionId,
      };
    }
    // Success: trust only an explicit `recordedInQwickly: true` from the server.
    const recorded = result.recordedInQwickly === true;
    return {
      ok: true,
      status: String(result.status ?? (recorded ? 'recorded' : 'demo_recorded')),
      message: result.message,
      demo: recorded ? false : result.demo !== false,
      recordedInQwickly: recorded,
      courseCode: result.courseCode,
      sessionId: result.sessionId,
      scannedAt: result.scannedAt,
    };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('The QR verification request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
