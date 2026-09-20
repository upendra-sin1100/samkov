# Deploy SamkovAI to Vercel and Railway

Repository: https://github.com/upendra-sin1100/samkov

The React/Next.js frontend runs on Vercel. The Python API runs on Railway. Keep the existing Neon PostgreSQL database and Clerk account service; neither host replaces them.

## 1. Choose the frontend URL and Clerk instance

Import the repository into Vercel to reserve its project URL, or use your custom domain. Use its exact HTTPS origin below, with no trailing slash (for example `https://YOUR-PROJECT.vercel.app`).

For a public launch, configure a production Clerk instance, including the frontend domain and email-code/Google sign-in settings. The publishable key, secret key, and issuer URL must belong to the same instance. Production and development Clerk users have different IDs: an existing development administrator does not automatically become a production administrator.

## 2. Railway — API

Create a service from this GitHub repository and the `main` branch.

| Setting | Value |
| --- | --- |
| Root directory | Repository root; leave blank or `/` |
| Configuration file | `/railway.json` |
| Dockerfile | `backend/Dockerfile` (configured in the file) |
| Start | `python -m backend.serve` (configured) |
| Pre-deploy | `python -m backend.manage migrate` (configured) |
| Health check | `/api/health` (configured) |

Set these Railway variables before deploying:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Your existing Neon pooled PostgreSQL URL, including `sslmode=require` |
| `CLERK_ISSUER_URL` | The HTTPS issuer for the chosen Clerk instance |
| `CLERK_SECRET_KEY` | That instance's secret key; backend only |
| `CLERK_AUTHORIZED_PARTIES` | Exact frontend origin, e.g. `https://YOUR-PROJECT.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | The same exact frontend origin |
| `AUTHORIZED_SIGNATORY` | `SamkovAI Program Office` or your preferred signatory |
| `FILE_STORAGE` | `disabled` unless you configure persistent uploads below |

Railway supplies `PORT`; the production entry point reads it. Generate a Railway public HTTPS domain after deployment. Opening `https://YOUR-API.up.railway.app/api/health` should return `status: ok`; `/api/catalog` should return the eight existing tracks. The health endpoint checks process availability; catalog access checks the database connection.

The existing database is initialized already. **Do not run `init` against it.** Pre-deploy applies repeatable migrations transactionally. For a genuinely new, empty database, run `python -m backend.manage init` once with its `DATABASE_URL` before the first deployment; migrations require an initialized schema.

## 3. Vercel — frontend

| Setting | Value |
| --- | --- |
| Git repository / branch | `upendra-sin1100/samkov` / `main` |
| Framework | Next.js |
| Root directory | `frontend` |
| Include files outside root in build | Enabled, so the workspace lockfile is available |
| Install command | `cd .. && npm ci` |
| Build command | `npm run build` |
| Output directory | Default `.next` |

Set these variables in Vercel's Production environment:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key from the same Clerk instance as Railway |
| `NEXT_PUBLIC_SITE_URL` | Exact public frontend origin |
| `PYTHON_API_URL` | Railway HTTPS API origin, with no trailing slash |

Deploy after setting the variables. `PYTHON_API_URL` is read during the frontend build; redeploy Vercel after changing it. Frontend `/api/*` requests are forwarded to Railway. Never put the database URL or Clerk secret key into Vercel public variables.

Use the production domain for live sign-in and submissions. Random Vercel preview URLs are not automatically trusted by the backend. Use a separate backend/database and explicitly configured origins for staging rather than allowing every preview domain.

## 4. Optional uploads

Project links and notes work with `FILE_STORAGE=disabled`.

For local-file mode on Railway, attach a persistent volume at `/data` and set:

```dotenv
FILE_STORAGE=local
UPLOAD_DIR=/data/uploads
FILE_SIGNING_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
```

Generate the secret locally and paste it into Railway variables. Do not commit it. Files stored on the ordinary container filesystem will not survive redeployment. Alternatively set `FILE_STORAGE=s3` and configure a private S3-compatible bucket using the variables in `docs/setup-and-launch.md`.

## 5. Confirm the release

1. Sign in and open the student dashboard; verify saved applications load.
2. If retaining the current Clerk instance, the existing administrator role remains. If switching instances, sign in first and assign the intended administrator with `python -m backend.manage make-admin --clerk-user-id user_THE_VERIFIED_ADMIN_ID` using the production database environment.
3. Open `/admin` (not `/admin/preview`) and verify account names/emails load.
4. Submit an HTTP/HTTPS project link on an approved internship. Confirm redirection to the dashboard and the pending submission.
5. Review it as admin, resize the details panel, and confirm the student sees the feedback.
6. If uploads are enabled, verify that an uploaded file survives a redeployment and its private review link works.

The repository includes host configuration, not provisioned Vercel/Railway services. Add the variables through each hosting dashboard; local `.env` files stay on your computer.

References: [Vercel monorepos](https://vercel.com/docs/monorepos), [outside-root sources](https://vercel.com/docs/monorepos/monorepo-faq), [Railway configuration](https://docs.railway.com/config-as-code/reference), [Railway health checks](https://docs.railway.com/deployments/healthchecks), [pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command).
