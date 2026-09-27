# Neon + Clerk setup and manual startup

## Why this option fits

Your Supabase limit is the number of projects, not the amount of SamkovAI data. Neon gives this app a separate PostgreSQL project and preserves the relational design. Its free plan has 0.5 GB storage per project and a compute allowance; it is not an upgrade in database capacity over Supabase. Clerk replaces Supabase Auth with managed email-code and Google login. Files are stored separately.

Current references: [Neon free plan](https://neon.com/blog/how-to-make-the-most-of-neons-free-plan), [Clerk pricing](https://clerk.com/pricing). Quotas can change. Clerk currently includes 50,000 monthly retained users per application. These are separate service accounts with their own limits. AWS is not required.

## 1. Create a Neon project

Create a project at https://console.neon.tech and choose a region close to your Python host. Copy the **pooled** PostgreSQL connection string from Connect into `backend/.env` as `DATABASE_URL`. Retain its TLS parameters, including `sslmode=require`. Do not paste this URL into frontend code or chat; it contains the database password.

For a fresh database, run from `D:\samkovAI` after installing requirements:

```powershell
.\.venv\Scripts\python.exe -m backend.manage init
.\.venv\Scripts\python.exe -m backend.manage check
```

Initialization refuses an existing `profiles` table and runs the schema transactionally. Alternatively execute `backend/schema.sql` once in Neon's SQL editor. Do not run both initialization methods. The old `supabase/schema.sql` cannot be used on Neon because it references Supabase-specific services.

## 2. Create a Clerk application

Create an application at https://dashboard.clerk.com. Enable **email sign-in/sign-up** with **email verification codes**. Disable passwords and email-link sign-in to use the requested OTP flow. Allow new signups. Enable Google as a social connection if wanted. Clerk handles code delivery, expiration, resend limits, and sessions.

Set these routes in the app/Clerk configuration:

- Sign-in: `/login`
- Sign-up: `/signup`
- Successful sign-in/sign-up: `/dashboard`

Copy the publishable key to `frontend/.env.local`. Find the Clerk instance/issuer URL in its JWT/session configuration and use the same instance on the backend. This is the `iss` value in its tokens (typically `https://your-instance.clerk.accounts.dev` during development). Do not use `https://api.clerk.com` as the issuer. Token verification uses public JWKS. Set CLERK_SECRET_KEY only in backend/.env to sync verified account emails, names, and usernames into the administrator directory. The key must belong to the same Clerk instance as the frontend publishable key.

For production configure your real frontend domain in Clerk and production Google credentials as instructed by Clerk. Use its production publishable key and issuer together. Authentication roles are stored in PostgreSQL, not in Clerk public metadata.

Reference: [Clerk token verification](https://clerk.com/docs/guides/sessions/manual-jwt-verification).

## 3. Environment files

`frontend/.env.local`:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_YOUR_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PYTHON_API_URL=http://127.0.0.1:8000
```

`backend/.env`:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@YOUR_NEON_POOLER_HOST/neondb?sslmode=require
CLERK_ISSUER_URL=https://YOUR_INSTANCE.clerk.accounts.dev
CLERK_AUTHORIZED_PARTIES=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTHORIZED_SIGNATORY=Your authorized program signatory
FILE_STORAGE=disabled
```

Replace placeholders; they are not working credentials. Remove obsolete Supabase values from your local environment once switching. Existing filled environment files are not overwritten by the repository changes. Restart both servers after changes; frontend variables are embedded when building.

If you use another port, change both site URLs, `CLERK_AUTHORIZED_PARTIES`, and your permitted Clerk origins. `localhost` and `127.0.0.1` are different browser origins. Use the configured URL consistently.

## 4. Optional project uploads

Repository URLs and notes work without file storage. Leave `FILE_STORAGE=disabled` until choosing storage; upload attempts show a clear configuration error.

For local development, add to `backend/.env`:

```dotenv
FILE_STORAGE=local
UPLOAD_DIR=backend/uploads
FILE_SIGNING_SECRET=REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
```

Generate a secret locally:

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
```

Production local mode requires a persistent volume and backups. Most free ephemeral app filesystems are unsuitable. Alternatively use a **private S3-compatible bucket**:

```dotenv
FILE_STORAGE=s3
S3_ENDPOINT_URL=https://YOUR_S3_COMPATIBLE_ENDPOINT
S3_BUCKET=your-private-bucket
S3_REGION=auto
S3_ACCESS_KEY_ID=YOUR_BUCKET_SCOPED_KEY
S3_SECRET_ACCESS_KEY=YOUR_SECRET
```

For AWS S3, omit the custom endpoint and use the actual AWS region. Storage billing is separate from Neon's free database. The backend validates ownership, file size and format and issues short-lived administrator download links. Never make the bucket public. Uploaded files not attached to a successful submission may require periodic orphan cleanup.

## 5. Administrators and free certificates

Sign in to the app with your administrator account. Its first workspace request creates an internal profile. In Neon's SQL editor, grant the role using the actual Clerk user ID:

```sql
update public.profiles set role = 'admin' where auth_subject = 'user_YOUR_ADMIN_ID';
```

Students cannot assign themselves roles. Administrators approve applications, review projects, and approve final completion.

Certificates are free after all projects and final completion are approved. Students claim them from their Certificate page. Payment credentials and webhooks are no longer required.

For a database created before free certificates and analytics were added, apply the repeatable migration before starting the current backend:

```powershell
.\.venv\Scripts\python.exe -m backend.manage migrate
```

New databases initialized with the current schema already include these changes.

## 6. Existing Supabase data (only if this app has real records)

The code change does not copy or delete any cloud data. Keep the original project until migration is verified. If this app has no saved data, simply initialize Neon and start using Clerk.

If it has real students:

1. Back up Supabase and pause writes during migration. Export public tables and the corresponding user IDs/emails securely. Do not migrate passwords or old session tokens.
2. Import into the new PostgreSQL schema preserving UUIDs: profiles first, then tracks/resources, applications, submissions, payments and certificates. Keep the audit history. Completed-app submission imports need a controlled migration transaction because normal submission triggers reject writes to completed internships; do not blindly replay records through student APIs.
3. Create/invite the corresponding Clerk accounts. After verifying the identity mapping, link each existing profile **before that student logs into SamkovAI**, using:

```powershell
.\.venv\Scripts\python.exe -m backend.manage link-account --user-id ORIGINAL_PROFILE_UUID --clerk-user-id user_VERIFIED_CLERK_ID
```

4. Copy private attachment objects to your new bucket/disk preserving keys. Moving database records alone does not move the files.
5. Compare row counts and verify an existing application, submission, issued certificate, revoked certificate, and supporting file. Switch the frontend to Clerk only after those checks.

Imported profiles may retain an email for operator-assisted matching, but the API never automatically links accounts by an email claim. No import has been executed by this code update; cloud connection details are required for a verified transfer.

## 7. One-time installation

Install Node.js 20.9+ and Python 3.12+. Windows PowerShell:

```powershell
cd D:\samkovAI
npm.cmd ci
if (!(Test-Path .venv\Scripts\python.exe)) { py -m venv .venv }
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if (!(Test-Path frontend\.env.local)) { Copy-Item frontend\.env.example frontend\.env.local }
if (!(Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
```

Fill your environment files, then initialize the new database as above.

## 8. Start manually in two terminals

Terminal 1 — Python backend:

```powershell
cd D:\samkovAI
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2 — frontend:

```powershell
cd D:\samkovAI
npm.cmd run dev -- --port 3000
```

Open http://localhost:3000 and leave both terminals open. Wait for `Ready` and the initial page compilation. For a stable preview without on-demand compilation, stop the development frontend with Ctrl+C, then:

```powershell
cd D:\samkovAI
npm.cmd run build
npm.cmd run start -- --port 3000
```

Do not start two frontend servers on the same port. Use `npm.cmd` if PowerShell blocks `npm.ps1`. The site no longer loads Google Fonts as an external render-blocking dependency.

### VS Code on Windows

Open `D:\samkovAI` as your VS Code folder. In a regular PowerShell terminal, run `npm.cmd run dev -- --port 3000`. Using `npm.cmd` avoids the PowerShell script execution-policy restriction; it does not require changing that policy or running VS Code as administrator. You can also choose **Terminal → Run Task → SamkovAI: Start frontend** to launch the same command directly.

If PowerShell cannot find `npm.cmd`, restart VS Code after installing Node so it picks up the updated PATH. For this machine's Node installation, `& 'D:\nodejs\npm.cmd' run dev -- --port 3000` also works from the project folder.

`EADDRINUSE` means another server is already listening on port 3000. Stop that server in its terminal with Ctrl+C before starting another one. Administrator mode does not resolve a port conflict. Avoid switching ports casually because the authentication origins are configured for localhost:3000.

Development uses `frontend/.next-dev`; production builds use `frontend/.next`. The separate caches prevent a production build from corrupting a running development preview. The file watcher ignores Windows paging, hibernation, dump, and system directories before trying to inspect them. Restart the development server after changing its configuration.

## 9. Verification

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:frontend
npm.cmd run test:database
npm.cmd run build
```

These checks do not contact your cloud accounts. After configuration, test real email-code login, Google login if enabled, per-student dashboard isolation, private uploads, and free certificate issuance. The support chat remains an automated guide, with no human agent connected.

## Live account directory

Use `/admin` for real accounts; `/admin/preview` contains sample data. The live directory includes accounts without applications, marked Not enrolled. The dashboard refreshes every 15 seconds while visible; Clerk synchronization is limited to once per minute per backend process. A sync outage is shown above the table while saved accounts remain available.

Account display fields come from the [Clerk Backend API](https://clerk.com/docs/reference/backend-api). Only verified primary emails are stored. Sync never assigns administrator roles, changes access flags, or links accounts by email. Use the existing make-admin command with the verified Clerk user ID to assign roles. Apply database migrations before starting an updated backend.
