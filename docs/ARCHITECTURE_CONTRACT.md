# HAKIM EDU Ω — Architecture Contract

## Product North Star

HAKIM EDU Ω is a Palestinian educational agentic operating system whose primary mission is to reduce teacher workload, improve educational quality, and serve the wider Palestinian education ecosystem. The teacher is the center of the system; AI agents perform authorized work on the teacher's behalf and never silently assume authority that belongs to a human or institution.

## Core operating loop

`INTENT → CONTEXT → PLAN → EXECUTE → VERIFY → CRITIQUE → REPAIR → REGRESSION → APPROVE → DELIVER → LEARN`

A failed tool, provider, or workflow step is a recoverable event whenever a safe alternative exists. The system must retry, switch strategy/provider/tool, decompose the task, or use a deterministic/local fallback before declaring NO-GO.

## Agent hierarchy

- Supervisor Agent: owns the mission state, delegation, budgets, permissions, and recovery.
- Teacher Agent: personalizes work to the teacher's role, classes, curriculum, schedule, and preferences.
- Curriculum Agent: retrieves and maps authoritative curriculum evidence.
- Pedagogy Agent: designs age-appropriate learning sequences and differentiation.
- Content Agent: creates lessons, worksheets, presentations, activities, and resources.
- Assessment Agent: builds, solves, validates, scores, and analyzes assessments.
- Quality/Evidence Agent: challenges outputs and distinguishes facts, evidence, preferences, inference, and unverified claims.
- Microsoft 365 Agent: operates only within granted Entra/Graph permissions across Teams, SharePoint, OneDrive, Calendar, and Education resources.
- Automation Agent: executes approved workflows and maintains resumable state.
- Learning Agent: identifies student needs and teacher workload opportunities while respecting privacy and policy.
- Security Agent: validates authorization boundaries, tenant isolation, secret handling, and unsafe actions.

## Authority model

Capability does not imply authority. Every external action is evaluated as:

`ACTOR → ACTION → TARGET → PURPOSE → SCOPE → EVIDENCE → APPROVAL → AUDIT`

Low-risk preparation can be autonomous. External communication, publishing, student-impacting actions, and sensitive institutional operations require the configured approval level. Actions that legally or professionally require a human remain human decisions.

## Microsoft 365 strategy

Microsoft Entra ID is the institutional identity layer. Microsoft Graph is the integration fabric. Teams is the collaboration and teaching surface. SharePoint/OneDrive are governed document stores. Calendar and Education APIs provide operational context where permissions allow it.

The system must support tenant isolation, least privilege, admin consent, token validation, auditability, and explicit institutional configuration.

## AI strategy

AI is routed by task and risk rather than hard-wired to one model. The router may use Gemini or another configured provider, and must retain a deterministic/local fallback for supported operations. Provider failure is not project failure.

Secrets must never be committed to GitHub or exposed to the browser when server-side storage is appropriate. BYOK is explicitly user-controlled and must be isolated from institutional secrets.

## Knowledge and evidence

Knowledge is classified as `OFFICIAL`, `TRUSTED`, `USER_PROVIDED`, `INFERRED`, or `UNVERIFIED`. High-impact claims require evidence. Palestinian curriculum and institutional policies must be grounded in authoritative sources where available. Islamic content must pass a source/evidence guard and must never invent Quranic or Hadith attribution.

## Educational quality

Every generated artifact is subject to structured validation. Mathematical visual order is explicit and never delegated to RTL/BiDi rendering. Numeric visualizations follow `VALUE → REQUIRED COUNT → VISUAL GROUP → COUNT CHECK`. A critical mismatch is `NO-GO` until repaired and re-tested.

## Teacher workload objective

The system optimizes for `TIME_RETURNED_TO_TEACHER`, `COGNITIVE_LOAD_REDUCTION`, `OUTPUT_QUALITY`, `LEARNING_SUPPORT`, and `RELIABILITY`, not feature count.

## Resumability

Every non-trivial mission has a durable state model with:

- mission id
- current state
- completed steps
- pending steps
- blockers
- evidence
- artifacts
- approvals
- failures/recovery attempts
- next safe action

A new session must be able to resume from the last confirmed state instead of repeating completed work.

## Production boundary

The public web application and API may run on Vercel. Microsoft 365 meeting/real-time media capabilities may require Microsoft/Azure-hosted components or approved Microsoft agent infrastructure. The architecture must not claim live Teams teaching, institutional Graph access, or official ministry endorsement until the corresponding deployment, permissions, and verification evidence exist.

## Definition of Done

A feature is DONE only when its implementation exists, its intended path is tested, failure paths are tested where practical, regression is clean, secrets and permissions are safe, and the resulting artifact is usable. Documentation alone is not implementation.
