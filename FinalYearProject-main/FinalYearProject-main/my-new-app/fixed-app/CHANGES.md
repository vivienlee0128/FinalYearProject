# Changes in the isolated copy

All paths below are relative to `fixed-app`. The original project remains in the parent folder.
82 original files were compared against their pre-work SHA-256 hashes: **zero changes**.
No APK was built or installed, and no database migration or external configuration was applied.

## Every changed existing file

| File | Change and reason |
| --- | --- |
| `.gitignore` | Ignores local environment files, the local npm cache and verification exports; permits safe environment examples. |
| `app.json` | Adds SecureStore and camera config plugins, including a meaningful camera permission description. Retains the existing application scheme and Android package identity. |
| `package.json` | Adds crypto, SecureStore, development-client and filesystem dependencies; aligns packages with Expo SDK 57; removes server dependencies from the frontend package; adds typecheck/test/API scripts and a React test renderer dev dependency. |
| `package-lock.json` | Records the new frontend dependency tree for reproducible installation. |
| `README.md` | Replaces starter documentation with setup, Entra configuration, Android networking, account mapping, security boundaries, remaining integrations and verification instructions. |
| `src/app/index.tsx` | Prepares an explicit authorization-code/PKCE request with a timeout; reports configuration, discovery, preparation, browser, cancellation and authorization failures; provides retry; prevents duplicate clicks; exchanges once and validates the user through the API before entering the portal. |
| `src/app/auth/callback.tsx` | Completes web popup authentication before session hydration, remains public, and provides an escape from a stalled callback. Native completion remains owned by Expo AuthSession. |
| `src/app/_layout.tsx` | Replaces the conflicting redirect effect with Expo Router protected screens. Login is the unauthenticated entry; callback stays public; student and lecturer screens are separated. Waits for session restoration. |
| `src/context/Auth.tsx` | Stores the server-validated profile and distinct internal student/SIS IDs, persists native tokens securely, restores and verifies sessions, refreshes expiring tokens, handles API 401 and logout, and exposes authenticated API requests. Removes identity/token debug logging. |
| `src/app/home.tsx` | Displays the correct student/lecturer portal and actions. The student scanner now opens `/qr`. Removes hardcoded webhook URLs and student/course fallbacks. |
| `src/app/qr.tsx` | Uses the authenticated API without a shared key or client-selected student identity; prevents concurrent scanner submissions; shows returned errors; recommends a native development build. |
| `src/app/lecture.tsx` | Loads server-authorized unit assignments; creates local prototype QR sessions, hides expired QR codes, polls class rosters, supports status overrides and authenticated class export. Explicitly labels the local prototype. |
| `src/app/attendance.tsx` | Loads only the signed-in student's records via the API; displays source/availability honestly; downloads official visa reports only through the configured reporting workflow. Removes direct client-credential requests, hardcoded programme/percentages and fake report fallbacks. |
| `src/app/attendancess.js` | Preserves the old URL by re-exporting the current attendance screen instead of retaining a second keyed API implementation and arbitrary student selection. |
| `src/app/register.tsx` | Replaces unsupported local password registration with instructions for university Microsoft account provisioning. |
| `src/app/demo.tsx` | Replaces unrestricted demo student creation with an explanation of administrator provisioning. |
| `src/attendance-api/server.js` | Restores a runnable Express API. Applies verified per-user authentication, account/role checks, assigned-class and enrollment authorization, parameterized PostgreSQL queries, local prototype endpoints and server-authenticated n8n downloads. Rejects unconfigured services instead of returning fabricated data. |
| `src/attendance-api/package.json` | Keeps server packages on the server; adds JOSE JWT verification and an Express version matching the async handlers; removes unrelated Expo/browser/password dependencies. |
| `src/attendance-api/package-lock.json` | Records the separate backend dependency tree. |

## Every added file

| File | Purpose |
| --- | --- |
| `.env.example` | Public client ID, tenant ID, API scope and API base URL template; no service credentials. |
| `.env.local` | Safe local starter configuration with the known public client/tenant IDs and emulator API URL. The API scope is blank pending the user's actual value. Ignored by Git. |
| `src/services/config.ts` | Centralizes public configuration and the `mynewapp://auth/callback` redirect. Detects Expo Go, insecure web origins, missing configuration and insecure release API URLs. |
| `src/services/api.ts` | Adds authorized requests, bounded request timing, structured API errors and operation timeouts. |
| `src/services/session-storage.ts` | Uses SecureStore for native session tokens; keeps web tokens in memory rather than browser persistent storage. |
| `src/services/reports.ts` | Downloads authorized report responses, checks MIME types, saves/shares native files and removes temporary native reports afterward. |
| `src/attendance-api/auth.js` | Verifies RSA signatures, issuer, audience, expiry/not-before, tenant, authorized client, delegated scope and token version; resolves trusted roles and student mappings from PostgreSQL. |
| `src/attendance-api/schema.sql` | Documents a fresh-development-database schema for student/SIS mapping, roles, enrollment, lecturer assignments and QR attendance. Not executed and not presented as a migration for an unknown existing schema. |
| `src/attendance-api/.env.example` | Server-only database, Entra validation and n8n configuration template. |
| `tests/auth-api.test.cjs` | Exercises the actual Express routes and JOSE signature/claim validation using temporary RSA keys and a mocked database/upstream. Covers forged/expired tokens, role restrictions, student identity and report credential isolation. |
| `tests/auth-ui.test.cjs` | Exercises the React login/context/protected routing with mocked native and OAuth/network boundaries. Covers success, cancellation, preparation/browser failure, duplicate presses, persistence, refresh, logout and role navigation. |
| `CHANGES.md` | This complete file-by-file explanation and validation record. |

## Omitted from the new copy

- `src/app/scx.py`: contained a credential; not retained. Its original is untouched.
- `src/app/services/qwickly.ts`: removed the obsolete helper from the route tree. API access now lives in `src/services`; no accidental `/services/qwickly` route is exported.
- Original root/backend `.env` files: not retained. Use the safe templates and configure actual server credentials locally.
- Original `node_modules`, caches, Git history and `scripts.zip`: not part of the source transfer. Dependencies in this folder were installed separately.

Other copied source, assets, configuration and the project requirements PDF remain unchanged.
Generated `.expo`, `.npm-cache`, `node_modules` and `dist-verification` contents are local tooling outputs, not hand-edited application files.

## Verification results

- `npm run typecheck`: passed; no TypeScript errors.
- `npm test`: **22 passed, zero failed**. React's renderer prints a deprecation notice; it does not affect test results.
- `node node_modules/expo/bin/cli install --check`: passed; dependencies are up to date for SDK 57.
- Android Hermes/JavaScript and web static export: passed; 12 routes exported, including the callback and excluding the old service route. This is not an APK build.
- Express HTTP startup/health is exercised in the API tests. The configured production entry point still requires the documented server environment.
- Original-secret-value scan over 97 source/bundle files: no matches. Secrets were compared internally and were not printed into the report.
- Original-file hash comparison: 82 checked, zero changed.

### Verification limits

The Microsoft browser, native OS storage and live PostgreSQL/n8n services are mocked in automated tests. Real token signature verification is exercised using test keys; no fake authentication mode is included in production code.

Live university sign-in has **not** been verified. It needs the public Entra API application ID/scope the user offered to provide, the registered callback, backend configuration and provisioned account rows. No available browser automation surface was connected, and device/APK work was stopped at the user's request.

Qwickly endpoint integration, official percentage calculation, SIS visa merging, actual n8n workflows and notifications are not claimed as complete. The existing local attendance prototype is explicitly opt-in (`ATTENDANCE_MODE=local`), and external service failures are visible.
