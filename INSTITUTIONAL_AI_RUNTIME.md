# HAKIM EDU Ω — Institutional AI Runtime

## Decision
The teacher-facing product must not require a personal Gemini/OpenRouter/Groq API key. Microsoft 365 / Microsoft Entra is the identity and authorization boundary. Microsoft Foundry Agent Service is the primary institutional AI runtime.

## Implemented
- Microsoft Entra institutional login remains the entry gate.
- Existing Entra application Client ID is configured as the public application identifier.
- Browser AI page no longer asks teachers for a Gemini API key.
- `api/agent.js` is a server-side gateway that accepts the teacher's Entra bearer token and forwards the request to a configured Microsoft Foundry Agent Application Responses endpoint.
- `api/health.js` reports whether the Foundry endpoint is configured.
- Foundry access uses the `https://ai.azure.com/.default` Entra scope; no provider secret is placed in browser code.
- The runtime contract is designed for Microsoft Foundry Responses protocol and can later be published to Teams / Microsoft 365.

## Required production configuration
The runtime environment must provide `FOUNDRY_AGENT_ENDPOINT`, pointing to the published Foundry Agent Application/agent Responses endpoint. The caller must have the required Foundry/Entra authorization. The deployment platform must provide server-side environment configuration; GitHub Pages alone cannot execute `api/*.js` as serverless functions.

## Production gate
NO-GO until all of the following are proven:
1. Teacher signs in with institutional Microsoft 365 account.
2. Browser obtains an Entra token for `https://ai.azure.com/.default` without unauthorized consent failure.
3. Server-side `/api/agent` reaches the Foundry endpoint.
4. A real teacher request returns a real model response.
5. Authorization prevents an unapproved tenant/user from invoking the agent.
6. Error, timeout, fallback and audit behavior pass regression tests.

## Next integration layers
Microsoft Graph / Teams / SharePoint / OneDrive / Assignments / Calendar; use delegated/OBO for user-context operations and dedicated agent identity for autonomous/background operations, with least privilege and auditability.
