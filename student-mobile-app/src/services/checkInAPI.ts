const N8N_URL = (
  process.env.EXPO_PUBLIC_N8N_URL ?? ""
).replace(/\/$/, "");


export interface CheckInRequest {
  sisId: string;

  courseLmsId: string;

  checkInId: string;

  rotatingValue: string;

  rawQr: string;
}


export interface CheckInResponse {
  success: boolean;

  mode:
    | "TEST"
    | "PRODUCTION";

  status: string;


  student: {
    qwicklyId: number;

    sisId: string;

    lmsId: string;

    name: string;

    email: string;
  };


  course: {
    qwicklyId: number;

    lmsId: string;

    name: string;

    code: string;
  };


  qr: {
    courseLmsId: string;

    checkInId: string;

    rotatingValue: string;

    raw: string;
  };


  candidateSession: {
    id: number;

    title:
      | string
      | null;

    method:
      | string
      | null;

    startTime: string;

    startedBy: unknown;

    isPreCreated:
      | boolean
      | null;

    ageMinutes: number;

    recent: boolean;
  };


  attendanceCheck: {
    alreadyRecorded: boolean;

    existingRecordCount: number;
  };


  validation: {
    studentIdentified: boolean;

    courseIdentified: boolean;

    enrollmentVerified: boolean;

    recentSessionFound: boolean;

    qrStructureVerified: boolean;

    qwicklyQrFreshnessVerified:
      boolean;

    qrSessionMappingVerified:
      boolean;
  };


  safeForAutomaticProductionWrite:
    boolean;

  testWritePossible:
    boolean;

  message: string;

  limitation?: string;
}


// ============================================
// CHECK-IN
// ============================================


export async function checkInStudent(
  request: CheckInRequest
): Promise<CheckInResponse> {
  if (!N8N_URL) {
    throw new Error(
      "EXPO_PUBLIC_N8N_URL is not configured."
    );
  }

  const url = `${N8N_URL}/webhook/check-in`;

  console.log("[CHECK-IN] Sending request:", url);
  console.log("[CHECK-IN] Payload:", request);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
    });
  } catch (error) {
    console.error("[CHECK-IN] Network error:", error);

    throw new Error(
      "Unable to connect to the attendance service."
    );
  }

  const text = await response.text();

  console.log("[CHECK-IN] HTTP:", response.status);
  console.log("[CHECK-IN] Raw response:", text);

  // HTTP 200 does not prove that attendance was recorded.
  if (!text.trim()) {
    throw new Error(
      "The attendance service returned HTTP " +
        response.status +
        " without a result. Check the n8n Respond to Webhook node. " +
        "Attendance has not been confirmed."
    );
  }

  let data: CheckInResponse;

  try {
    data = JSON.parse(text) as CheckInResponse;
  } catch {
    throw new Error(
      "The attendance service returned invalid JSON."
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    typeof data.success !== "boolean" ||
    typeof data.status !== "string" ||
    typeof data.message !== "string"
  ) {
    throw new Error(
      "The attendance service returned an incomplete response."
    );
  }

  
  if (!response.ok) {
    let errorMessage = `Check-in failed (HTTP ${response.status}).`;

    try {
      const errorData = JSON.parse(text);

      if (typeof errorData.message === "string") {
        errorMessage = errorData.message;
      }
    } catch {
      // Keep the HTTP error message.
    }

    throw new Error(errorMessage);
  }

  if (
    !data ||
    typeof data !== "object" ||
    typeof data.success !== "boolean" ||
    typeof data.status !== "string" ||
    typeof data.message !== "string"
  ) {
    throw new Error(
      "The attendance service returned an incomplete response."
    );
  }


  
  if (!data.success) {
    console.log(
      "[CHECK-IN] Validation completed without attendance recording:",
      {
        status: data.status,
        mode: data.mode,
        message: data.message,
        qrFreshnessVerified:
          data.validation?.qwicklyQrFreshnessVerified,
        sessionMappingVerified:
          data.validation?.qrSessionMappingVerified,
      }
    );
  }

  return data;

}
