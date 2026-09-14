require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors()); // Browsers (Expo Web) enforce CORS; native apps don't.
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ------------------------------------------------------------
// Middleware: checks the same "Authorization: Bearer <API_KEY>"
// header your React Native fetchData() already sends.
// ------------------------------------------------------------
function requireApiKey(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!process.env.API_KEY || token !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// ------------------------------------------------------------
// GET /api/attendance/:studentId
// Returns { student, overallAttendance, units } — matching
// exactly what fetchData() in App.js expects.
// ------------------------------------------------------------
app.get("/api/students",  requireApiKey, async (req, res) => {
  try {
    const studentsResult = await pool.query(
      "SELECT id, name, sis_id, overall_attendance FROM students"
    );

    res.json(studentsResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------------------------------------------------

app.get("/api/attendance/:studentId", requireApiKey, async (req, res) => {
  const { studentId } = req.params;

  try {
    const studentResult = await pool.query(
      "SELECT id, name, sis_id, overall_attendance FROM students WHERE id = $1",
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentResult.rows[0];

    const unitsResult = await pool.query(
      `SELECT u.code, u.name, su.attendance
       FROM student_units su
       JOIN units u ON u.code = su.unit_code
       WHERE su.student_id = $1`,
      [studentId]
    );

    res.json({
      student: {
        id: student.id,
        name: student.name,
        sis_id: student.sis_id,
      },
      overallAttendance: Number(student.overall_attendance),
      units: unitsResult.rows.map((u) => ({
        code: u.code,
        name: u.name,
        attendance: Number(u.attendance),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Attendance API running on port ${PORT}`);
});