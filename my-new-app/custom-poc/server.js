// const express = require('express');
// const app = express();

// // Allows the API to understand JSON data sent from n8n
// app.use(express.json());

// // A GET endpoint to send data TO n8n
// app.get('/api/students', (req, res) => {
//   res.json({
//     success: true,
//     data: [
//       { studentID: 14744, name: "Alice", status: "Present" },
//       { studentID: 14745, name: "Bob", status: "Absent" }
//     ]
//   });
// });

// // A POST endpoint to receive data FROM n8n
// app.post('/api/attendance', (req, res) => {
//   console.log("Data received from n8n:", req.body);
//   res.json({ success: true, message: "Attendance recorded successfully!" });
// });

// // Start the server on port 3001 (so it doesn't conflict with Expo on 3000)
// app.listen(3001, () => console.log('API Server running at http://localhost:3001'));

const express = require('express');
const app = express();
app.use(express.json());

// 1. Define your emulated API key
const VALID_API_KEY = "poc-student-key-12345";

// 2. Create the authentication middleware
function requireApiKey(req, res, next) {
  // Look for the key in the 'x-api-key' header or 'Authorization' header
  const providedKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  // If using Authorization, it might come as "Bearer poc-student-key-12345"
  if (providedKey === VALID_API_KEY || providedKey === `Bearer ${VALID_API_KEY}`) {
    next(); // Key matches, proceed to the requested route
  } else {
    // Key is missing or wrong, reject the request
    res.status(401).json({ error: "Unauthorized: Invalid or missing Student Profile API Key" });
  }
}

// 3. Apply the 'requireApiKey' middleware to this specific endpoint
app.get('/api/students/profile', requireApiKey, (req, res) => {
  // If the code reaches here, the API key was valid!
  res.json({
    success: true,
    profile: {
      studentID: 14744,
      name: "Alice",
      email: "14744@swinburne.edu.my",
      qwickly_internal_id: 998877
    }
  });
});


// 1. Mock Student Data API (Visa Compliance)
app.get('/api/students/:sis_id/visa-compliance', requireApiKey, (req, res) => {
  res.json({
    sis_id: req.params.sis_id,
    name: "Alice",
    visa_status: "Active",
    visa_expiry: "2027-03-15",
    attendance_rate: "88%", // Emulated Qwickly data merged in
    compliance_status: "PASS"
  });
});

// 2. Mock Qwickly Class Attendance (Excel Export Data)
app.get('/api/qwickly/course/:course_id/export', requireApiKey, (req, res) => {
  res.json([
    { studentID: "14744", name: "Alice", date: "2026-09-20", status: "Present" },
    { studentID: "14745", name: "Bob", date: "2026-09-20", status: "Absent" },
    { studentID: "14746", name: "Charlie", date: "2026-09-20", status: "Excused" }
  ]);
});
app.listen(3001, () => console.log('Secure API Server running at http://localhost:3001'));