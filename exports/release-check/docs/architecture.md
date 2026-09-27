# SamkovAI architecture

The browser renders Next.js pages and obtains short-lived Clerk session tokens. Next.js forwards `/api/*` to the Python/FastAPI backend. The browser never receives PostgreSQL credentials. The frontend works in labeled preview mode without a Clerk public key.

FastAPI verifies Clerk JWT signatures against the configured issuer's JWKS, checks expiry, issuer, not-before, subject and authorized origin, then resolves `profiles.auth_subject` to an internal UUID. Roles and disabled status come from PostgreSQL, never browser metadata. Imported profile UUIDs can be explicitly linked to verified Clerk IDs using the management command.

Neon hosts standard PostgreSQL. `backend/db.py` uses a four-connection psycopg pool and parameterized queries. Synchronous database operations run in worker threads for Windows compatibility. Schema and transactional protections are in `backend/schema.sql`. The original Supabase schema is a historical migration reference only.

Relations: profiles → applications → submissions; tracks and resources define the curriculum; payments and certificates each have a unique application key. SQL triggers enforce level gates, immutable approved evidence, curriculum protection, and audit records. Certificate issuance locks records, checks eligibility and matching payment records, and is idempotent. The Python backend verifies capture, amount, currency and signatures with Razorpay before invoking issuance. Administrators are assigned by the database owner.

Clerk hosts OTP email delivery and optional Google OAuth. Enable email codes and disable password/email-link strategies in Clerk. No custom email OTP service or Supabase Auth call remains in the app. Clerk SDK screens handle codes, expiry, resend and session management.

Private file uploads pass through the API with a verified token and approved application ownership. Files are capped at 5 MB with permitted types and signature checks. `FILE_STORAGE=local` requires persistent disk and a signing secret; `s3` supports private S3-compatible buckets. Administrators receive download URLs valid for 120 seconds. No attachment bytes are stored in PostgreSQL. Local development's unsigned preview cannot upload files.

Public certificate verification exposes only achievement details. Student workspace queries filter by internal user UUID; administrator operations verify the database role. All project and payment writes go through server routes. Database credentials must never be shared with clients or other untrusted services.

Routes: `/`, `/internships`, `/internships/:slug`, `/tasks`, `/tasks/:slug`, `/login`, `/signup`, `/apply/:slug`, `/dashboard`, `/learn/:slug`, `/submit/:slug`, `/offer`, `/certificate`, `/admin`, `/verify/:id`.
