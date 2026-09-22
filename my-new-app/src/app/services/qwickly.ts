// // services/qwickly.ts
// //https://swinburnesarawak.instructure.com/api/lti/authorize?client_id=135030000000000208&login_hint=8f76855408088ee4cd70d11cf442a68f618dc384&lti_message_hint=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXJpZmllciI6ImM0YjRhNmFiMDdmYzRiOTU1NjRlMmRlYTg5NzM2ZDQzMzVlN2U1MDUyYWRiZmU2MGViODBiNGI3N2JkY2MwOWY0ZGMwNTBiNWY0ZmY5N2FlOTgzZGRhNDRhNWU0NjgxOWYzYzU3MmU5NWU5ZTYxZGJhNTJmZmRmODJiYzc2NGQzIiwiY2FudmFzX2RvbWFpbiI6InN3aW5idXJuZXNhcmF3YWsuaW5zdHJ1Y3R1cmUuY29tIiwiY29udGV4dF90eXBlIjoiQ291cnNlIiwiY29udGV4dF9pZCI6MTM1MDMwMDAwMDAwMDAyMjQ0LCJjYW52YXNfbG9jYWxlIjoiZW4tR0IiLCJpbmNsdWRlX3N0b3JhZ2VfdGFyZ2V0Ijp0cnVlLCJleHAiOjE3ODk5OTcxNjd9.h5Jo8-PNkrep1MWRrYN8x7We_tOagSSUezK6nbZc-7M&nonce=aa18df3d17b54a05bde21d1b05f8efde4e9baa62b5bf11f190fd06fff71318ed&prompt=none&redirect_uri=https%3A%2F%2Fau.qwickly.tools%2Fattendance%2Flaunch%2F&response_mode=form_post&response_type=id_token&scope=openid&state=state-3d3354f3-0d33-4049-b478-bc3f2a5ff24e
// // Retrieve keys from your .env file
// const CLIENT_ID = process.env.EXPO_PUBLIC_QWICKLY_CLIENT_ID || "";
// const CLIENT_SECRET = process.env.EXPO_PUBLIC_QWICKLY_CLIENT_SECRET || "";

// // NOTE: The YAML file defines the paths (e.g., /api/...) but does NOT include a "servers" block with the base domain. 
// // You still need to replace this placeholder with your university's specific Qwickly domain.
// const QWICKLY_BASE_URL = 'https://au.qwickly.com'; 

// /**
//  * Step 1: Obtain OAuth 2.0 Bearer Token
//  * Endpoint: /api/auth/token/
//  */
// async function getAccessToken() {
//   try {
//     const params = new URLSearchParams();
//     params.append('grant_type', 'client_credentials');
//     params.append('client_id', CLIENT_ID);
//     params.append('client_secret', CLIENT_SECRET);

//     const response = await fetch(`${QWICKLY_BASE_URL}/api/auth/token/`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: params.toString()
//     });

//     if (!response.ok) {
//       throw new Error(`Auth Failed: ${response.statusText}`);
//     }

//     const data = await response.json();
//     // Returns the temporary bearer token string (e.g., "access_token")
//     return data.access_token; 
//   } catch (error) {
//     console.error("Qwickly Auth Error:", error);
//     return null;
//   }
// }

// /**
//  * Step 2: Fetch Student Profile details to get internal User ID
//  * Endpoint: /api/dashboard/v1/user/{user_identifier}/
//  */
// export async function fetchStudentProfile(studentID: string) {
//   const token = await getAccessToken();
//   if (!token) throw new Error("Could not authenticate with Qwickly");

//   try {
//     // The YAML specifies we can prefix the ID to search by Student ID (SIS ID)
//     const response = await fetch(`${QWICKLY_BASE_URL}/api/dashboard/v1/user/sis_id:${studentID}/`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     if (!response.ok) throw new Error(`User Fetch Failed: ${response.status}`);
//     return await response.json();
    
//   } catch (error) {
//     console.error("Qwickly User Fetch Error:", error);
//     return null;
//   }
// }

// /**
//  * Step 3: Fetch Attendance Records for a specific session
//  * Endpoint: /api/dashboard/v1/course/{course_identifier}/session/{session_id}/record/
//  */
// export async function fetchStudentAttendance(courseId: string, sessionId: string, internalUserId: number) {
//   const token = await getAccessToken();
//   if (!token) throw new Error("Could not authenticate with Qwickly");

//   try {
//     // The YAML defines attendance records are stored under specific courses and sessions, 
//     // filterable by user_id
//     const url = `${QWICKLY_BASE_URL}/api/dashboard/v1/course/${courseId}/session/${sessionId}/record/?user_id=${internalUserId}`;
    
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     if (!response.ok) throw new Error(`Attendance Fetch Failed: ${response.status}`);
//     return await response.json();

//   } catch (error) {
//     console.error("Qwickly Attendance Fetch Error:", error);
//     return null;
//   }
// }

// services/qwickly.ts

const N8N_WEBHOOK_URL = process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL;

export async function fetchStudentAttendanceViaN8N(studentID: string) {
  if (!N8N_WEBHOOK_URL) {
    throw new Error("EXPO_PUBLIC_N8N_WEBHOOK_URL is not configured.");
  }

  try {
    // Calls n8n, passing the studentID as a query parameter
    const response = await fetch(`${N8N_WEBHOOK_URL}?studentID=${encodeURIComponent(studentID)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("n8n Proxy Fetch Error:", error);
    return null;
  }
}