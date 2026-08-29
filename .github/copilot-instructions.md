# HAKIM Ω — Autonomous Engineering Contract

## Mission
Maintain and evolve HAKIM Ω as a production-grade educational workspace. Preserve existing functionality unless a strictly better replacement exists.

## Operating rules
1. Inspect before changing. Prefer the smallest safe change.
2. Never require an AI API key for application startup or deterministic/local features.
3. Never put provider secrets in client code, browser storage, source files, logs, exports, or test fixtures.
4. All model calls must pass through the server-side AI Gateway/Provider Router.
5. Prefer deterministic/local execution and cache before any external AI call.
6. Treat provider quota, rate-limit, timeout, network, auth, and model-unavailable failures as recoverable routing events where safe.
7. A single provider failure must not make the application unavailable.
8. Use explicit math structures and explicit visual order; never rely on browser BiDi behavior for educational math order.
9. Numeric graphics must be generated and then counted/verified against the intended value.
10. Educational output must pass applicable structural, pedagogical, mathematical, language, developmental, CPA, mastery, RTL, math-order, and counting checks before being presented as verified.
11. Do not claim a feature is implemented or verified without code/test evidence.
12. Every change must run build, lint, tests, failure tests, and regression tests where applicable.
13. If a test fails, diagnose and fix the root cause before declaring success.
14. Keep the UI usable when all AI providers are unavailable; activate OFFLINE/LOCAL mode instead of a fatal error.
15. Use Arabic-Indic/Eastern Arabic numerals and preserve Arabic RTL requirements for educational UI.

## Provider policy
Supported providers are pluggable. Credentials are optional configuration, never startup prerequisites. Provider health must be based on an actual health check, not merely the presence of a key. 429/quota responses must trigger cooldown and fallback rather than blind retries.

## Cost policy
Use the cheapest adequate execution path. Cache identical requests, deduplicate in-flight work, compact context, retrieve only relevant file chunks, and choose output budgets dynamically. Do not use a high-reasoning model for routine work.

## Change discipline
Do not rewrite the project from scratch. Before each substantive change identify: existing behavior, risk, tests covering it, and rollback-safe implementation. After the change, run the complete applicable quality gate and update documentation/evidence.
