# HAKIM EDU Ω — PROJECT STATE

## Mission
Build a Palestinian educational agentic operating system centered on supporting teachers, reducing workload, improving learning, and serving students, families, schools, directorates, and the Ministry within authorized institutional boundaries.

## Operating rule
The user is a non-technical end user. The agent leads execution, uses available tools, chooses non-critical implementation decisions, validates work, and resumes from repository state rather than relying on chat continuity. Do not make the user manage technical execution.

## Product goal
Deliver a professional, production-ready HAKIM EDU Ω that teachers can use through their institutional Microsoft 365 identity, with agentic task execution, educational intelligence, automation, quality assurance, security, and Microsoft 365/Teams integration.

## Current baseline
- Repository: `smileeyes1/personal-ai-workspace`
- Default branch: `main`
- Product identity: HAKIM EDU Ω
- Primary production identity: Microsoft 365 institutional account via Microsoft Entra ID.
- Target users: Palestinian teachers first; then students, families, schools, directorates, and Ministry users within authorization.
- Existing Agent Kernel/governance work is retained and must not be broken.

## Target architecture
1. Agent kernel and durable mission state
2. Microsoft Entra ID / Microsoft 365 identity and RBAC
3. Microsoft Graph Education integration
4. Teams integration and authorized teaching workflows
5. AI model router with Gemini and safe fallbacks
6. Knowledge/RAG grounded in authoritative educational sources
7. Palestinian curriculum and pedagogy engine
8. Evidence, truth, Islamic-values, privacy, and safety guards
9. Output quality and adversarial QA
10. Teacher workload automation and Teacher Teaching Twin
11. Student learning and intervention intelligence
12. Observability, audit, recovery, and security
13. Production deployment and end-to-end verification

## Product behavior
The teacher should express a goal in natural language. The system converts it into a managed mission:
Understand → gather context → retrieve evidence → plan → execute → verify → adversarial-check → repair → regression-test → request approval when required → perform authorized external actions → audit → deliver → learn.

The system should be autonomous where safe and require human authorization for consequential actions. Capability never implies authority.

## Microsoft 365 direction
Production sign-in is institutional Microsoft 365 / Entra ID. The intended UX is: Sign in with Microsoft 365 → validate tenant/account/role → load authorized institutional context. Microsoft Graph is integrated incrementally with least privilege. Teams, SharePoint/OneDrive, Calendar, Assignments and education resources are enabled only when authorized.

## Teaching-agent direction
Future authorized modes: Teacher Copilot → Co-Teacher → Authorized Substitute Agent → multimodal/voice Teaching Twin. AI voice/avatar must be clearly disclosed as synthetic and must never be represented as the real teacher.

## Non-negotiable quality gates
- Never claim execution or verification without evidence.
- Critical failure => NO-GO until repaired and regression-tested.
- User intent is primary; do not force technical decisions onto the end user.
- Preserve existing working behavior while extending the system.
- Secrets must remain server-side and out of source control.
- Institutional permissions follow least privilege and explicit authorization.
- AI-generated educational outputs require validation before delivery.
- Mathematical visual order and numeric visual counts are explicit and testable.

## Continuity contract
This file is the durable handoff for future ChatGPT sessions. If the conversation stops, a new session must:
1. Read `PROJECT_STATE.md` first.
2. Inspect the latest `main` commit and changed files.
3. Inspect current CI/deployment status.
4. Identify the first incomplete milestone.
5. Continue execution from that point without asking the user to reconstruct prior technical context.
6. Update this file after each material milestone with completed work, verification evidence, failures, blockers, and the exact next milestone.
7. Never restart the project merely because the chat changed.

## Execution discipline
Do not wait for user confirmation for non-critical technical decisions. Use available tools. If a tool/path fails, diagnose, choose an alternative, retry, and verify. Stop only for a genuine external authority/credential requirement or an unresolved critical failure; record it explicitly and continue all independent work.

## External gates
Real Microsoft tenant configuration, institutional Graph consent, production secrets, and organization-owned policies require authorized institutional access. Build and validate all non-secret scaffolding and integration paths before these gates.

## Current milestone
Harden and integrate the Agent Kernel with the existing application, then proceed through Microsoft 365 identity/Graph scaffolding, AI gateway, knowledge layer, educational engine, automation, QA/security, and production verification.

## Blockers
No project blocker recorded. External institutional credentials/consent are a future release gate for live Microsoft tenant operations, not a reason to stop independent development.
