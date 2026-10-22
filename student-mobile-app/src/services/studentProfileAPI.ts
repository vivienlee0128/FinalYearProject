
const BASE_URL =
  "https://fyp-workflow.swin.click/webhook/student-profile-demo";

export interface StudentEnrolment {
  unitId: string;
  code: string;
  name: string;
  semester: string;
  enrolmentStatus: string;
  source: string;
}

export interface StudentVisa {
  applicable: boolean;
  status: string;
  expiryDate: string | null;
  reviewRequired: boolean;
  isSynthetic: boolean;
  note: string;
}

export interface StudentProfile {
  studentId: string;
  sisId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  studentType: "DOMESTIC" | "INTERNATIONAL";
  campus: string;
  faculty: string;
  programme: {
    code: string;
    name: string;
    durationYears: number;
  };
  yearOfStudy: number;
  semester: string;
  academicStatus: string;
  enrolments: StudentEnrolment[];
  visa: StudentVisa;
  isSynthetic: boolean;
}

interface ProfileResponse {
  success: boolean;
  student?: StudentProfile;
  error?: string;
  message?: string;
}

export async function getStudentProfile(
  sisId: string,
  signal?: AbortSignal
): Promise<StudentProfile> {
  if (!sisId) {
    throw new Error("Student SIS ID is missing.");
  }

  const url =
    `${BASE_URL}?mode=profile&sis_id=${encodeURIComponent(sisId)}`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(
      `Student Profile API returned HTTP ${response.status}`
    );
  }

  const data: ProfileResponse = await response.json();

  if (!data.success || !data.student) {
    throw new Error(
      data.message ??
      data.error ??
      "Student profile could not be found."
    );
  }

  return data.student;
}
