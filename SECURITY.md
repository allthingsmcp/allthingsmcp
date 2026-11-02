# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately through GitHub: open the **Security** tab of this repository and choose **Report a vulnerability**
(<https://github.com/allthingsmcp/allthingsmcp/security/advisories/new>).

Include what you found, the affected component (`apps/web`, `apps/guide-runtime`, `supabase/`, or a Guide example),
steps to reproduce, and the impact you expect. We aim to acknowledge reports within 3 business days and to share a
remediation plan within 10 business days. We will credit you in the advisory unless you ask us not to.

## Scope

In scope:

- The website in `apps/web` and the Guide Runtime in `apps/guide-runtime`, including authentication, session handling,
  the shared-secret bearer tokens between them, rate limiting, and workspace isolation.
- Supabase migrations, row-level-security policies, and the `welcome-email` Edge Function.
- Code samples and downloadable projects shipped with Guides.

Out of scope: vulnerabilities in third-party services (Supabase, Vercel, Resend, Open-Meteo) or in upstream MCP SDKs
(report those to their maintainers), social engineering, and denial-of-service through volumetric traffic.

## Supported versions

Only the current `main` branch and the production deployment receive fixes.

## Handling secrets

Never commit credentials. Use `.env.local` / `.env` files (git-ignored) and the `.env.example` templates. If you
believe a secret was committed, report it as above so it can be rotated.
