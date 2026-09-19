# SamkovAI

Project-based virtual internships with a Next.js frontend and Python/FastAPI backend.

**Current stack: Neon PostgreSQL + Clerk authentication + private file storage.** Supabase is no longer a runtime dependency. The original `supabase/schema.sql` remains only as a migration reference.

See [setup and launch](docs/setup-and-launch.md) for exact configuration, email OTP, Google login, file storage, and migration notes.

## Run locally (Windows PowerShell)

Install Node.js 20.9+ and Python 3.12+. From `D:\samkovAI`:

```powershell
npm.cmd ci
if (!(Test-Path .venv\Scripts\python.exe)) { py -m venv .venv }
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if (!(Test-Path frontend\.env.local)) { Copy-Item frontend\.env.example frontend\.env.local }
if (!(Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
```

Set the environment values, then initialize a **new, empty** Neon database:

```powershell
.\.venv\Scripts\python.exe -m backend.manage init
.\.venv\Scripts\python.exe -m backend.manage check
```

Start the backend in one terminal:

```powershell
cd D:\samkovAI
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend in another:

```powershell
cd D:\samkovAI
npm.cmd run dev -- --port 3000
```

Open http://localhost:3000 after Next.js reports Ready. The first development request compiles the page. For a stable preview, stop development and use `npm.cmd run build` followed by `npm.cmd run start -- --port 3000`.

Without a Clerk public key, the UI offers an explicitly labeled in-memory preview. It does not create real accounts or save progress. Live work needs both Clerk and the PostgreSQL backend configured.

## Checks

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:frontend
npm.cmd run test:database
npm.cmd run build
```

Backend tests cover authorization, JWT verification, payment verification, query parameterization, and private files. Database tests execute the real PostgreSQL schema in PGlite and exercise level gates, ownership, completion, certificate issuance and revocation. They do not connect to your cloud database.

## Included flows

The admin dashboard lives at `/admin` and requires a server-verified administrator account when authentication is configured. It includes a searchable learner sheet, level and course filters, pending reviews, CSV export, and a user details panel. **Approve & Promote** approves the pending evidence for the current level only when every required project has been submitted; the existing project gates then unlock the next level. Final program completion remains in `/admin/manage`, alongside curriculum, resources, and certificate controls.

Use `/admin/preview` to explore the dashboard with clearly labeled sample learners. Preview changes are in memory only and never update live accounts. Project links are available for actual submissions; sample submissions do not link to invented repositories.

Eight initial tracks, curated course links, three project levels, application review, offer letters, per-student progress, evidence submission, administrator feedback, free certificates after verified completion, QR verification, dark/light themes, and an automated support guide. Human support is not connected. Resource attribution is in [resource sources](docs/resource-sources.md).

## Deployment

Host `frontend/` as the Next.js app and `backend/` as a Python service. Set `PYTHON_API_URL` before building the frontend. Keep database credentials, file credentials, and payment secrets on the backend. Neon stores structured records; upload binaries use a private bucket or persistent backend disk, not database space. The backend pool opens at most four connections per worker.

No cloud accounts or live payment credentials are provisioned by this repository. Verify real Clerk login, Neon connectivity, uploads, and free certificate issuance before enabling a live program.
