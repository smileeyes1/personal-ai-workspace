# AGENTS.md — Development Directives for HAKIM Ω

## Core Engineering Rule: Minimum Tokens / Maximum Quality

1. **Development Mode**: ECONOMIC (Default)
   - Minimize LLM context and tool calls.
   - Deterministic and static tests first; no unnecessary LLM pinging.
   - Unit tests, linter, and compiler before any external calls.
   - LLM quality tests ONLY at milestones or when explicitly testing generation accuracy.

2. **Surgical Changes (Read/Modify/Write)**:
   - Identify only the exact affected files before touching code.
   - Use small patches (`edit_file` / `multi_edit_file`) instead of rewriting entire files.
   - Do not re-read unchanged files.

3. **Quota & Failure Handling**:
   - Never hammer LLM APIs after 429 or quota limit.
   - Respect retryDelay and circuit breaker state.
   - Fallback to local deterministic validations.

4. **Project Architecture Context**:
   - Backend: Node.js Express server (`server.js`) on Port 3000.
   - Frontend: Single-file vanilla JS/HTML/Tailwind UI (`index.html`).
   - Routes: `/api/health`, `/api/config`, `/api/gemini`, `/api/verify`, `/api/competencies`, `/api/projects`.
   - Models: Primary (`gemini-3.7-flash`), Fallback (`gemini-3.1-flash-lite`), Deep Thinking (`gemini-3.1-pro-preview`).

5. **Response Format**:
   - What changed
   - Build status (pass/fail)
   - Test status (pass/fail)
   - Remaining issues (if any)
