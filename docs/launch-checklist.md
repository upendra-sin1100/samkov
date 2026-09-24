# SamkovAI launch checklist — 25 September 2026

The code builds and its automated checks pass. This is deployment readiness, not confirmation that a public production environment has been provisioned or tested.

## Before public enrollment

- Buy your domain and attach it to Vercel. Choose one canonical HTTPS origin and redirect the other host to it.
- Configure a production Clerk instance on that domain. Use its matching publishable key in Vercel and secret key/issuer in Railway. Finish Clerk DNS and email-code/Google sign-in configuration.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical origin in **both** services. Set Railway `CLERK_AUTHORIZED_PARTIES` to that origin. Remove an old `VERIFICATION_SITE_URL` override so QR codes use the same domain.
- Set Vercel `PYTHON_API_URL` to the Railway API origin, then redeploy both services. The frontend's environment values are embedded during its build.
- Keep Railway's migration pre-deploy command enabled. Do not reinitialize the existing database.
- Sign up again and assign the new admin using `python -m backend.manage make-admin --clerk-user-id user_YOUR_NEW_ID`. All previous accounts, including the admin, were deleted at the owner's request.
- Keep uploads disabled unless persistent storage is configured. Links and notes work without file uploads.
- Provide your public privacy/participation terms and a monitored contact channel. The current support widget is an automated guide, not a human inbox.

## Test on the final domain

1. Sign up and log in using email code and Google if enabled.
2. Save a profile, apply for two different internships, approve them as admin, and verify the dashboard chooser.
3. Submit a project. Confirm a second submission to the pending project is blocked. Request changes and confirm resubmission works; approve it and confirm the next level unlocks.
4. Complete all required projects and approve completion. Confirm the internship moves to profile history and the certificate is available.
5. Open both document links and scan both QR codes from a separate device. Confirm the chosen domain and correct learner record.
6. Reload the offer, certificate, and selected-task panels. Check mobile layout and print/save each document.

## Checks completed locally

- JavaScript/JSX check and Next.js production build.
- 42 backend tests, including authentication/authorization, ownership, review restrictions, and document verification.
- Frontend state tests and actual PostgreSQL schema tests, including the pending-submission upsert guard and repeatable migrations.
- Production npm dependency audit: zero reported vulnerabilities at the time of this review.
- Python dependency compatibility check: no broken requirements.
- Document layouts checked at desktop and mobile widths; each sample prints on one A4 page.

Full hosting settings: [Vercel and Railway deployment](deploy-vercel-railway.md).
