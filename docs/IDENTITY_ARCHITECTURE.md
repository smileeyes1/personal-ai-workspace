# HAKIM EDU Ω — Institutional Identity Architecture

## Decision
The primary production sign-in model is Microsoft 365 institutional identity through Microsoft Entra ID (work/school accounts). Local passwords are not part of the intended production experience.

## Goals
- One institutional identity for teachers and authorized staff.
- Tenant-aware isolation: users may access only resources permitted by their institution and role.
- Least-privilege authorization after authentication.
- Seamless use of Microsoft 365 context where approved: profile, school/organization, Teams, SharePoint/OneDrive and education resources through Microsoft Graph.
- No client-side secrets.
- Auditable authentication and authorization decisions.

## Production flow
1. User opens HAKIM EDU Ω.
2. User selects **Sign in with Microsoft 365**.
3. Microsoft Entra ID authenticates the institutional account.
4. HAKIM validates issuer, tenant, audience, token claims and account status server-side.
5. HAKIM resolves the user's authorized role and organization scope.
6. Only then are application features and Microsoft Graph operations enabled.
7. Every privileged action is evaluated against policy and recorded in the audit trail.

## Authorization model
Authentication answers **who are you?** Authorization answers **what are you allowed to do?**.

Minimum roles:
- Teacher
- School Staff
- School Administrator
- Directorate Staff
- Ministry Staff
- System Administrator

The role model must be configurable by the institution and must not infer administrative authority merely from a display name or email address.

## Microsoft Graph integration
Graph permissions are requested incrementally and only when required by a feature. Read-only access is preferred before write access. Actions that affect students, classes, Teams, assignments, files, messages or publication require explicit policy checks and, where configured, user approval.

## Multi-tenant safety
- Tenant ID is a security boundary.
- No cross-tenant resource lookup is permitted by default.
- Every resource operation is scoped to the authenticated tenant and authorized organization.
- External/personal Microsoft accounts are not accepted for institutional production unless an institution explicitly enables them.

## Credential and secret rules
- Client secrets, certificates and API keys remain server-side.
- No secret is committed to GitHub.
- Production secrets belong in the deployment secret store / environment configuration.
- Refresh tokens are handled only by the identity integration layer.

## Failure behavior
If institutional authentication or required Graph consent is unavailable, the system must fail closed for protected operations. It may continue in a clearly marked local/demo mode only where no institutional data or privileged operation is involved.

## User experience
The teacher should not configure OAuth, tenant IDs, Graph permissions or API details. The intended UX is simply:

**Sign in with Microsoft 365 → HAKIM recognizes the institutional context → the teacher works.**

## Required acceptance tests
- Valid institutional account can sign in.
- Invalid audience/issuer is rejected.
- Wrong tenant is rejected.
- Suspended/disabled account cannot access protected resources.
- Teacher cannot access another teacher's restricted resources.
- Teacher cannot perform administrator-only actions.
- No client bundle contains a production secret.
- Logout invalidates the application session.
- Graph access is unavailable until required authorization is present.
