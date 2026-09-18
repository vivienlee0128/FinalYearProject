// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const { Pool } = require("pg");
// const bcrypt = require("bcryptjs");
// const app = express();
// app.use(cors()); // Browsers (Expo Web) enforce CORS; native apps don't.
// app.use(express.json());

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// // ------------------------------------------------------------
// // Middleware: checks the same "Authorization: Bearer <API_KEY>"
// // header your React Native fetchData() already sends.
// // ------------------------------------------------------------
// function requireApiKey(req, res, next) {
//   const authHeader = req.headers.authorization || "";
//   const token = authHeader.replace("Bearer ", "");

//   if (!process.env.API_KEY || token !== process.env.API_KEY) {
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   next();
// }
// //API
// app.post("/api/register", requireApiKey, async (req, res) => {
//   const { name, email, password } = req.body || {};

//   if (!name || !email || !password) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     const existing = await pool.query(
//       "SELECT id FROM users WHERE email = $1",
//       [email]
//     );

//     if (existing.rows.length > 0) {
//       return res.status(409).json({ error: "Email already registered" });
//     }

//     const hash = await bcrypt.hash(password, 10);

//     await pool.query(
//       "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)",
//       [name, email, hash]
//     );

//     res.status(201).json({ message: "Account created successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // app.post('/api/register', requireApiKey, async (req, res) => {
// //   const { name, email, password } = req.body;

// //   // Basic validation
// //   if (!name || !email || !password) {
// //     return res.status(400).json({ message: 'All fields are required.' });
// //   }

// //   try {
// //     // Check if the user already exists
// //     const userCheckQuery = 'SELECT id FROM users WHERE email = $1';
// //     const existingUser = await pool.query(userCheckQuery, [email]);

// //     if (existingUser.rows.length > 0) {
// //       return res.status(409).json({ message: 'Email is already in use.' });
// //     }

// //     // Hash the password (10 is the salt rounds, standard for most apps)
// //     const saltRounds = 10;
// //     const hashedPassword = await bcrypt.hash(password, saltRounds);

// //     // Insert the new user into the database
// //     // Assuming your table is named 'users' and has columns: name, email, password_hash
// //     const insertQuery = `
// //       INSERT INTO users (name, email, password_hash)
// //       VALUES ($1, $2, $3)
// //       RETURNING id, name, email;
// //     `;
// //     const result = await pool.query(insertQuery, [name, email, hashedPassword]);

// //     const newUser = result.rows[0];

// //     // Respond with success (Do NOT send the password back)
// //     res.status(201).json({
// //       message: 'User registered successfully',
// //       user: newUser
// //     });

// //   } catch (error) {
// //     console.error('Database Error:', error);
// //     res.status(500).json({ message: 'Internal server error.' });
// //   }
// // });
// //POST method

// app.post("/api/login", requireApiKey, async (req,res)=>{
//   const {email, password} = req.body || {};

//   if(!email || !password){
//     return res.status(400).json({error: "Email and/or password not the match"});
//   }

//   try {
//     const result = await pool.query(
//       "SELECT id, email, name, password_hash FROM users WHERE email = $1",[email]
//     );

//     if(result.rows.length === 0 ){
//       return res.status(401).json({error:"Invalid email or password"});
//     }

//     const user = result.rows[0];
//     const passwordMatches = await bcrypt.compare(password, user.password_hash);

//     if (!passwordMatches) {
//       return res.status(401).json({ error: "Invalid email or password" });
//     }
 
//     res.json({ id: user.id, email: user.email, name: user.name });
//   }catch (err) {
//     console.error(err);
//     res.status(500).json({error :"Server Error"});
//   }
// });
// // ------------------------------------------------------------
// // GET /api/attendance/:studentId
// // Returns { student, overallAttendance, units } — matching
// // exactly what fetchData() in App.js expects.
// // ------------------------------------------------------------
// app.get("/api/students",  requireApiKey, async (req, res) => {
//   try {
//     const studentsResult = await pool.query(
//       "SELECT id, name, sis_id, overall_attendance FROM students"
//     );

//     res.json(studentsResult.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // ----------------------------------------------------------------

// app.get("/api/attendance/:studentId", requireApiKey, async (req, res) => {
//   const { studentId } = req.params;

//   try {
//     const studentResult = await pool.query(
//       "SELECT id, name, sis_id, overall_attendance FROM students WHERE id = $1",
//       [studentId]
//     );

//     if (studentResult.rows.length === 0) {
//       return res.status(404).json({ error: "Student not found" });
//     }

//     const student = studentResult.rows[0];

//     const unitsResult = await pool.query(
//       `SELECT u.code, u.name, su.attendance
//        FROM student_units su
//        JOIN units u ON u.code = su.unit_code
//        WHERE su.student_id = $1`,
//       [studentId]
//     );

//     res.json({
//       student: {
//         id: student.id,
//         name: student.name,
//         sis_id: student.sis_id,
//       },
//       overallAttendance: Number(student.overall_attendance),
//       units: unitsResult.rows.map((u) => ({
//         code: u.code,
//         name: u.name,
//         attendance: Number(u.attendance),
//       })),
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// app.post("/api/sessions/create", async (req,res) => {
//   const { unit_code, duration_minutes = 15 } = req.body || {};

//   if (!unit_code){
//     return res.status(400).json({error : "Unit Code is required"});
//   }
//   try{
//     const token = crypto.randomBytes(32).toString("hex");
//     const expiredAt = new Date(Date.now() + duration_minutes * 60 * 1000);

//     const resultpool = await pool.query(
//       `INSERT INTO attendance_sessions (unit_code, session_token, expires_at)
//        VALUES ($1, $2, $3)
//        RETURNING id, session_token, expires_at`,
//        [unit_code,token,expiredAt]
//     );
//     res.status(200).json(result.rows[0]);
//   }catch(err){
//     console.error(err);
//     res.status(500).json({error: "Server Error"});
//   }
// });

// app,post("/api/sessions/scan", requireApiKey, async (req,res) => {
//   const {session_token, student_id} = res.body || {};

//   if(!session_token || !student_id){
//     return res.status(400).json({error : "ST and SiD are required"});
//   }
//     try{
//       const sessionresult = await pool.query(
//         `SELECT id, expires_at FROM attendance_sessions
//        WHERE session_token = $1`,
//       [session_token]
//       );
//       if (sessionresult.rows.length === 0){
//         return res.status(404).json({error: "Invalid QR"});
//       }
//       const session = sessionresult.rows[0];

//       if(new Date()> new Date(session.expiredAt)){
//         return res.status(400).json({error: "QR Expired"});

//       }

//       await pool.query( `INSERT INTO attendance_scans (session_id, student_id)
//        VALUES ($1, $2)`,
//       [session.id, student_id]);

//       res.json({message :"Attendance filled"});
//     } catch (err){
//       if(err.code === "23505"){
//         return res.status(409).json({error: "Attendance already recorded"});
//       }
//       console.error(err);
//       res.status(500).json({error: "Server Error"});
//     }

// });

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Attendance API running on port ${PORT}`);
// });

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto"); // FIX 1: was missing, needed for randomBytes()
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function requireApiKey(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!process.env.API_KEY || token !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ------------------------------------------------------------
// POST /api/register
// ------------------------------------------------------------
app.post("/api/register", requireApiKey, async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)",
      [name, email, hash]
    );

    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------------------------------------------
// POST /api/login
// ------------------------------------------------------------
app.post("/api/login", requireApiKey, async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email, name, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------------------------------------------
// GET /api/students
// ------------------------------------------------------------
app.get("/api/students", requireApiKey, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, sis_id, overall_attendance FROM students ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------------------------------------------
// GET /api/attendance/:studentId
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// POST /api/sessions/create
// ------------------------------------------------------------
app.post("/api/sessions/create", requireApiKey, async (req, res) => { // FIX 6: added requireApiKey
  const { unit_code, duration_minutes = 15 } = req.body || {};

  if (!unit_code) {
    return res.status(400).json({ error: "Unit code is required" });
  }

  try {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + duration_minutes * 60 * 1000);

    const result = await pool.query( // FIX 2: was "resultpool" then referenced as "result"
      `INSERT INTO attendance_sessions (unit_code, session_token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, session_token, expires_at`,
      [unit_code, token, expiresAt]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------------------------------------------
// POST /api/sessions/scan
// ------------------------------------------------------------
app.post("/api/sessions/scan", requireApiKey, async (req, res) => { // FIX 3: was "app,post"
  const { session_token, student_id } = req.body || {}; // FIX 4: was "res.body"

  if (!session_token || !student_id) {
    return res.status(400).json({ error: "session_token and student_id are required" });
  }

  try {
    const sessionResult = await pool.query(
      `SELECT id, expires_at FROM attendance_sessions
       WHERE session_token = $1`,
      [session_token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: "Invalid QR code" });
    }

    const session = sessionResult.rows[0];

    if (new Date() > new Date(session.expires_at)) { // FIX 5: was "session.expiredAt"
      return res.status(400).json({ error: "QR code has expired" });
    }

    await pool.query(
      `INSERT INTO attendance_scans (session_id, student_id)
       VALUES ($1, $2)`,
      [session.id, student_id]
    );

    res.json({ message: "Attendance recorded successfully" });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Attendance already recorded for this session" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/student-by-email/:email", requireApiKey,async (req,res) => {
  const {email} = req.params;

  try{
    const result = await pool.query(
      "SELECT id AS student_id FROM students WHERE email = $1",
      [email]
    );

    if (result.rowCount.length === 0 ){
      return res.status(400).json ({error: "No student connected to this account"});
    }
    res.json(result.row[0]);
  }catch(err){
    console.error(err);
    res.status(500).json({error : "server down/error"})
  }
});

//Register Direct to API not with manual SQL entry

app.get("/api/demo", requireApiKey, async (req,res) =>{
  const {data_id, data_name, data_student_id} = req.body || {};

  if(!data_id || !data_name || !data_student_id){
    return res.status(400).json({error: "All data needed for the SQL"});
  }

  try{
    const checkUser = await pool.query(
      "SELECT id FROM students WHERE sis_id = $1", [sis_id]);
      if(checkUser.rows.length > 0 ){
        return res.status(409).json({error: "Student id existed"});
      }

      const insertQuery = `
      INSERT INTO students (name, sis_id, overall_attendance)
      VALUES ($1, $2, $3)
      RETURNING id, name, sis_id, overall_attendance;`;

      const result = await pool.query(insertQuery,[data_id,data_name,data_student_id]);
      res.status(201).json({ 
      message: "Student saved to database successfully!",
      student: result.rows[0]
    });
  }catch (err){
    if (err.code === "23505") {
      return res.status(409).json({ error: "Attendance already recorded for this session" });
  }
  console.error(err);
  res.status(500).json({error: "Server error"})
}
});

const PORT = process.env.PORT || 6521;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Attendance API running on port ${PORT}`);
});