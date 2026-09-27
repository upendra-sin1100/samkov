# Domain, documents, and feedback release

- Public privacy policy: `/privacy`; program contact: `samkovaicorporation@gmail.com`.
- Offer and certificate wording identifies SamkovAI as an independent program, not a registered company. Certificate print styling uses orange logo-inspired borders.
- The mobile header exposes Sign in and Sign up without opening the menu.
- Approved and completed participants can submit one private rating and feedback message per internship from the certificate page. Server-side screening rejects listed abusive terms, common obfuscations, and selected threats. This is a basic language filter, not comprehensive moderation across all languages. Nothing is published automatically; admins review the private inbox in their dashboard.

## Deployment

Deploy the backend with `python -m backend.manage migrate` before enabling feedback in the frontend. Migration `007_program_feedback.sql` is repeatable and creates the feedback table. The repository's Railway configuration already runs migrations before deployment; other hosts must run this command through their deployment setup. Do not initialize an existing database.

Keep `NEXT_PUBLIC_SITE_URL=https://samkovai.me` in frontend and backend settings. Remove any obsolete `VERIFICATION_SITE_URL` override so QR codes use that domain. Deploy the updated frontend source; redeploying an older source revision will not include these changes.

## Validation

Run `npm test`, `npm run test:frontend`, and `npm run build`. Manually check mobile Sign in and Sign up, private feedback submission/rejection, administrator review, and single-page offer/certificate printing. Test Google sign-in separately after its provider credentials are configured.
