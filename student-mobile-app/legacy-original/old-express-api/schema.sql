-- Bootstrap a NEW development database. Review/adapt before applying to an existing database.
-- Never seed a user's role from an email address or a value sent by the mobile client.
BEGIN;
CREATE TABLE IF NOT EXISTS students (
  id text PRIMARY KEY, name text NOT NULL, sis_id text UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS units (
  code text PRIMARY KEY, name text NOT NULL, qwickly_course_id text
);
CREATE TABLE IF NOT EXISTS auth_accounts (
  tenant_id uuid NOT NULL, microsoft_oid uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'lecturer')),
  display_name text NOT NULL, email text NOT NULL,
  student_id text REFERENCES students(id), active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (tenant_id, microsoft_oid),
  CHECK (role <> 'student' OR student_id IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS student_units (
  student_id text REFERENCES students(id), unit_code text REFERENCES units(code),
  attendance numeric CHECK (attendance BETWEEN 0 AND 100), PRIMARY KEY (student_id, unit_code)
);
CREATE TABLE IF NOT EXISTS lecturer_units (
  tenant_id uuid NOT NULL, microsoft_oid uuid NOT NULL, unit_code text REFERENCES units(code),
  PRIMARY KEY (tenant_id, microsoft_oid, unit_code),
  FOREIGN KEY (tenant_id, microsoft_oid) REFERENCES auth_accounts(tenant_id, microsoft_oid)
);
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id text PRIMARY KEY, unit_code text NOT NULL REFERENCES units(code),
  session_token text UNIQUE NOT NULL, expires_at timestamptz NOT NULL,
  tenant_id uuid NOT NULL, lecturer_oid uuid NOT NULL,
  FOREIGN KEY (tenant_id, lecturer_oid) REFERENCES auth_accounts(tenant_id, microsoft_oid)
);
CREATE TABLE IF NOT EXISTS attendance_scans (
  session_id text REFERENCES attendance_sessions(id), student_id text REFERENCES students(id),
  status text NOT NULL CHECK (status IN ('Present','Late','Absent','Excused')),
  recorded_at timestamptz NOT NULL DEFAULT NOW(), PRIMARY KEY (session_id, student_id)
);
COMMIT;
