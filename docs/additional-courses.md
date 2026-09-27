# Additional courses

Added 2026-09-26: Frontend Development, Backend Development, Java Development, Mobile App Development, DevOps & Cloud, and System Design. Each includes six original project briefs across three levels and two direct learning resources. Frontend takes six weeks; the other tracks take eight.

## Release

Before releasing the frontend, run `python -m backend.manage migrate` against the intended database. Migration `006_additional_courses.sql` inserts the six tracks and leaves existing curricula, applications, and certificates untouched. It is safe to repeat. Fresh databases include the same tracks in `backend/schema.sql`.

Deploy the updated frontend after the migration. Until that migration runs, existing live databases cannot accept applications for the new tracks. No changes to authentication or certificate configuration are needed.

## Certificates

The existing SamkovAI certificate flow applies to every added track: all six projects must be approved, an administrator must approve final completion, and the learner then claims a free certificate. Certificates contain the course title, duration, participant, dates, and six completed projects. Repeated claims return the same certificate; revoked certificates remain revoked. External learning resources do not themselves issue a SamkovAI certificate.

## Validation

`npm run test:database` includes every new course's project gates, completion prerequisites, certificate fields, repeated claims, revocation, and repeatable migration with an existing enrollment. `docs/new-course-link-check.json` records HTTP status, destination, and page title for all twelve learning links, checked on 2026-09-26. All returned HTTP 200, including the Node.js documentation redirect.

The course catalogue and briefs are maintained in `frontend/app/additional-courses.js`; any future change to names, duration, or projects must be kept consistent with database curriculum rules.

Validation completed locally: production build, JavaScript checks, frontend tests, 45 backend tests, and both database suites passed. `node scripts/check-additional-course-ui.cjs` checked all fourteen catalogue entries, all six new courses' resource URLs and project counts, route selection, offer and certificate layouts at 320/390/1200px, and verification record display. Its QR images are stubbed for layout checks; the backend suite separately checks the real QR endpoint's exact verification destination. These checks do not represent a live deployment or a real learner's certificate issuance.
