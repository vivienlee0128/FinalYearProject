# Swinburne attendance - isolated fixes

This folder is a separate copy. The files in the parent project were not edited.
The architecture remains Expo Router + React authentication context + Express/PostgreSQL.
Run commands from **this folder**, not the parent project. No APK has been built.

## Start here

1. Frontend dependencies: `npm ci`.
2. API dependencies: `npm ci --prefix src/attendance-api`.
3. Edit the supplied `.env.local` with **public** settings. Use `.env.example` as reference.
4. Copy `src/attendance-api/.env.example` to `src/attendance-api/.env` and set the server values locally.
5. Review `src/attendance-api/schema.sql` and apply it to a **new development database**. It is not a migration for your unknown existing schema. No database was modified during these fixes.
6. Provision account mappings and unit assignments as described below.
7. Start the API: `npm run api`. Start Metro: `npm start`.

The public API scope is deliberately blank in `.env.local` until your real Entra scope is supplied.
This produces a visible configuration message rather than a silently disabled button.
No client secret is needed for Microsoft authorization code + PKCE.

## Microsoft Entra registration

Keep the existing client and tenant IDs if these are the university-approved registrations.
The API may be registered separately, or exposed by the same registration if configured accordingly.

- Expose a delegated API permission, for example `api://<API application ID>/access_as_user`.
- Grant the mobile/web client that delegated permission and obtain the consent required by your university.
- Set the API registration's `api.requestedAccessTokenVersion` to `2`.
- Set `EXPO_PUBLIC_MS_API_SCOPE` to that complete scope.
- Set server `MS_API_AUDIENCE` to the API application's GUID, `MS_CLIENT_ID` to the client application's GUID, and `MS_TENANT_ID` to the university tenant GUID.
- Server `MS_REQUIRED_SCOPE` is the permission name (`access_as_user`), not the full URI.
- Under the client's mobile/desktop platform, register **`mynewapp://auth/callback`** exactly.
- For optional web testing, register the exact web URL (for example `http://localhost:8081/auth/callback`) under the **Single-page application** platform. List its origin in server `CORS_ORIGINS`.
- Do not enable an implicit flow or embed a Microsoft secret in the app to make PKCE work.

Native sign-in requires a development/preview build containing this app's scheme and native modules.
Expo Go is detected and explains the limitation. An existing build from before these native dependencies were added will need rebuilding **later**, when you choose to build an APK.
The development login screen displays the generated redirect URI so it can be compared with Entra.

## Android networking

The supplied public API URL is `http://10.0.2.2:6522/api`, suitable for an Android emulator talking to the host computer during development.
A physical Android device needs a reachable host address or an HTTPS endpoint; `localhost` on the phone means the phone itself.
Release/preview authentication requires an HTTPS API URL. Do not disable TLS checks.
For web on this computer use `http://localhost:6522/api` and a localhost/HTTPS app URL, not a LAN HTTP origin.

## Identity and role provisioning

The server verifies the Microsoft JWT's signature against tenant keys, RS256 algorithm, issuer, audience, lifetime, tenant, client (`azp`), v2 token version and delegated scope.
It then looks up **tenant ID + Microsoft object ID (`oid`)** in `auth_accounts`.
Neither the email address, Microsoft `sub`, nor a client-supplied role/student ID grants access.

For a student, provision:

- `students.id`: the application's internal student ID.
- `students.sis_id`: the university Student Information System ID.
- `auth_accounts`: their tenant/object IDs, `role='student'`, display name/email, and `student_id` pointing to that internal student record.
- `student_units`: their enrolled units.

For a lecturer, provision their `auth_accounts` row with `role='lecturer'`, then assign units in `lecturer_units`.
The app has no public role assignment or password registration endpoint.
An unprovisioned account gets a clear 403 message after Microsoft sign-in; it is not automatically granted a role.

## Session behavior

Android/iOS access and refresh tokens are saved with Expo SecureStore, restored on launch and validated with `/api/auth/me`.
Access tokens are refreshed before expiry; failed refresh or API 401 clears the local session.
Web tokens stay in memory, so a full browser reload requires sign-in again.
Sign out clears this app's state/storage, not Microsoft's browser cookies. Account selection is requested on the next sign-in.
User access tokens are runtime credentials; no shared API key or service client secret is bundled in the frontend.

## Attendance and reporting boundaries

The existing PostgreSQL attendance prototype is restored behind verified user authorization. It is **disabled by default**.
Set server `ATTENDANCE_MODE=local` only to use that prototype. Lecturer sessions/rosters/overrides and student QR scanning then operate on the local database, not Qwickly.
The roster polls every five seconds. The student dashboard displays stored `student_units.attendance` percentages; it does not invent values or derive official Qwickly percentages from local scans.
Student scans derive identity server-side and require enrollment. Lecturers can only manage assigned units.
QR tokens expire and duplicate attendance inserts are prevented by a database constraint.

The new server forwards report requests to the existing n8n architecture:

- `N8N_VISA_REPORT_URL`: workflow must accept `sis_id`, merge Qwickly and SIS visa data, and return PDF bytes with `application/pdf`.
- `N8N_CLASS_EXPORT_URL`: workflow must accept `course_id` and return XLSX bytes with the proper XLSX MIME type. Set `units.qwickly_course_id` to the real Qwickly ID.
- `N8N_API_KEY`: server-only bearer credential that the workflows must validate.

These workflow contracts are documented integration points, not supplied/verified n8n workflows.
No real Qwickly API specification, workflow export or university data source was supplied. Therefore Qwickly writes, official attendance aggregation, SIS visa merging and notifications remain integration work. Failed requests never fall back to fake official records.

## Checks (no APK build)

```powershell
npm run typecheck
npm test
node node_modules/expo/bin/cli install --check
node node_modules/expo/bin/cli export --platform android --platform web --output-dir dist-verification
```

The last command compiles JavaScript/Hermes and web routes; it does not build or install an APK.
Tests use locally generated RSA keys and mocked Microsoft/network/database/native-storage boundaries. They do not sign into a real university account or write to a live database.
See `CHANGES.md` for every edited/added/omitted source file and verification results.

## Secrets

Original `.env` files, the credential-bearing `src/app/scx.py`, dependencies/caches and `scripts.zip` were not retained in this copy.
Only server `.env` should contain DATABASE_URL and n8n credentials. Both environment files are ignored by Git.
The original project's exposed credential remains untouched as requested; its owner should rotate it if it was real.

References: [Expo SDK 57 AuthSession](https://docs.expo.dev/versions/v57.0.0/sdk/auth-session/), [Microsoft API token validation](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens).
