# HAKIM EDU Ω — PROJECT STATE

## Mission
Build a Palestinian educational agentic operating system centered on supporting teachers, reducing workload, improving learning, and serving students, families, schools, directorates, and the Ministry within authorized institutional boundaries.

## Operating rule
The user is a non-technical end user. The agent leads execution, uses available tools, chooses non-critical implementation decisions, validates work, and resumes from repository state rather than relying on chat continuity.

## Current baseline
- Repository: `smileeyes1/personal-ai-workspace`
- Default branch: `main`
- Latest known commit: `e4a1cde578fb8e0a5d68d6cd504e9d754a4b1dc3`
- HAKIM EDU Ω product vision and operating model documented.
- Resumable mission kernel and governance tests added.
- GitHub quality/deployment checks previously reported successful.

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
Implement and verify the production-grade Agent Kernel integration with durable mission state and explicit action authorization, then connect it to the existing UI/API without breaking current functionality.

## Blockers
None recorded at this checkpoint. External institutional credentials/consent are required only when reaching real Microsoft tenant/Graph/Teams operations; build all non-secret integration scaffolding and validation before that gate.
