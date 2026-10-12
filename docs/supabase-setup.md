# Dedicated Registrix setup

Use a separate project. The owner's project is `ltrgglgkxhejxzdiqkdt`; both other portfolio projects remain separate.

## New empty project

Run the files in `supabase/migrations` in filename order, then `supabase/seed.sql`. An output file `Registrix-Supabase-Setup.sql` combines these for a **new empty** project; run it once. It creates records tables, private staff authorization, RLS and scoped transactional APIs, and imports 398 confirmed source catalog entries. It creates no real students or accounts. Do not run the original setup repeatedly against an initialized database.

For the owner who ran the initial setup during implementation, `Registrix-Supabase-Upgrade.sql` is the tested follow-up catalog and recovery-scope hardening. Applied upgrades are documented in AUDIT.md. Later migrations must be applied in order; do not reset a populated project.

## Auth settings

- Keep email confirmation enabled and anonymous sign-in disabled.
- Local Site URL: `http://127.0.0.1:5190`. Add `http://127.0.0.1:5190/**` to redirect URLs for verification and password reset.
- For deployment, replace Site URL with the HTTPS domain and allow its verification/reset paths. Avoid arbitrary wildcard domains.
- The app accepts the numeric code supplied by the provider, rather than a fixed demo OTP. To use codes, include `{{ .Token }}` in the Confirm signup template. The default confirmation-link email is also supported when Site URL/redirects are configured.
- If using custom SMTP, keep all credentials in Supabase settings. The frontend does not send mail directly. Configure the sender/provider and confirm delivery with your own account. The OTP lifetime/rate limits belong to Supabase Auth; the app provides a 60-second resend UI cooldown.
- Password reset uses the provider's email link and `/reset-password` callback, followed by sign-out and normal sign-in.

## First administrator

Register and verify your own account, then run `docs/admin-access.sql` manually after replacing **only** the `approved_email` value with your confirmed email. The placeholder guard prevents accidental grants. It resolves that account's UUID and grants administrator membership only in the dedicated database. Do not expose this script through a browser endpoint. Subsequent approvals and teacher assignments use the administrator workspace.

## Security contracts

Profiles contain display fields, not passwords. Positions/user-editable metadata never grant roles. Live membership and assignments are rechecked on every record operation and on receipt recovery. All ten tables have RLS; clients have no direct write grants. Public wrappers are invoker functions with empty search paths. Private transaction helpers validate authority, fields, versions and actor-bound request identity before committing one audit event.

Mutation serialization uses one transaction advisory lock for atomic permission changes and final-admin protection. This favors correctness at portfolio scale; higher write volume can partition locking later while preserving the security/concurrency regressions.

Only the Project URL and publishable key belong in `.env.local`. Never copy the restaurant or MediSched schema/credentials. Optional `supabase/demo-seed.sql` adds only explicitly fictional identities/enrollments; it is not included in normal setup.
