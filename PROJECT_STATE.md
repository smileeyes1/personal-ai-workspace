# HAKIM EDU Ω — PROJECT STATE

## Mission
Build a Palestinian educational agentic operating system centered on supporting teachers, reducing workload, improving learning, and serving students, families, schools, directorates, and the Ministry within authorized institutional boundaries.

## Operating rule
The user is a non-technical end user. The agent leads execution, uses available tools, chooses non-critical implementation decisions, validates work, and resumes from repository state rather than relying on chat continuity.

## Current baseline
- Repository: `smileeyes1/personal-ai-workspace`
- Default branch: `main`
- Latest code commits at this checkpoint: `41e0f18` (institutional auth gate), `1f0fa01` (CI identity-layer validation), followed by this state update.
- HAKIM EDU Ω product vision and operating model documented.
- Resumable mission kernel and governance tests added.
- Existing app loads `enterprise-auth.js` and `enterprise-graph.js`.
- Institutional Microsoft 365 sign-in is now enforced at the browser gate for protected production use.

## Target architecture
1. Agent kernel and durable mission state
2. Microsoft Entra ID / Microsoft 365 identity and RBAC
3. Microsoft Graph Education integration
4. Teams integration and authorized teaching workflows
5. AI model router with Gemini and safe fallbacks
6. Knowledge/RAG layer grounded in authoritative educational sources
7. Palestinian curriculum and pedagogy engine
8. Evidence, truth, Islamic-values, privacy, and safety guards
9. Output quality and adversarial QA
10. Teacher workload automation and Teacher Teaching Twin
11. Student learning and intervention intelligence
12. Observability, audit, recovery, and security
13. Production deployment and end-to-end verification

## Non-negotiable quality gates
- Never claim execution or verification without evidence.
- Critical failure => NO-GO until repaired and regression-tested.
- User intent is primary; do not force technical decisions onto the end user.
- Preserve existing working behavior while extending the system.
- Secrets must remain server-side and out of source control.
- Institutional permissions follow least privilege and explicit authorization.
- AI-generated educational outputs require validation before delivery.
- Mathematical visual order and numeric visual counts are explicit and testable.

## Continuity / recovery
If the ChatGPT conversation stops, resume by reading this file, inspecting the latest GitHub commit, CI status, and changed files. Continue from the first incomplete milestone; do not restart or ask the user to reconstruct technical context.

## Current next milestone
Complete server-side Microsoft identity validation and tenant/role authorization, then harden Graph/Teams actions behind explicit authorization and audit controls. After that, proceed to durable agent execution and production integration.

## External gate
Real institutional login cannot be fully activated until an authorized Microsoft 365 administrator registers/approves the HAKIM Entra application and supplies the public Client ID / permitted Tenant configuration. This is an institutional authorization boundary, not a missing code task. No production secret belongs in GitHub.
