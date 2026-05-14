# Audit Apply Note — AINewsletterGenerator

Source: `_AUDIT/reports/batch_05.md` section 35.

## Original Recommendations
### Missing AI counterparts
- `/segment-optimize`
- `/send-time-optimize`
- `/subscriber-prediction`
- `/churn-detection`

### Missing non-AI
- Preference management; compliance (GDPR/CAN-SPAM); list mgmt (import, dedupe); dynamic content blocks; CRM/ecommerce integration; real-time analytics; preference center

### Custom suggestions
- Agentic campaign orchestrator; real-time subscriber intelligence; batch content variants; integration ecosystem; vertical templates; community features

## Implemented
Added three endpoints in `server/routes/ai.js`:
- `POST /api/ai/segment-optimize`
- `POST /api/ai/send-time-optimize`
- `POST /api/ai/churn-detection`

Reused `callOpenRouter`, `parseAIJson`, `persistResult`, `auth`, `aiRateLimiter`, and existing `ai_results` table.

## Backlog
| Item | Tag |
|---|---|
| `/subscriber-prediction` | MECHANICAL |
| Preference center | NEEDS-PRODUCT-DECISION |
| GDPR/CAN-SPAM compliance tooling | NEEDS-PRODUCT-DECISION |
| List import/dedupe | MECHANICAL |
| Dynamic content blocks | NEEDS-PRODUCT-DECISION |
| CRM/Shopify/HubSpot integrations | NEEDS-CREDS |
| Realtime analytics dashboard | NEEDS-PRODUCT-DECISION |
| Vertical template library | NEEDS-PRODUCT-DECISION |

## Apply pass 3 (frontend)

Verified FE wiring for the pass-2 endpoints. No changes required:

- `client/src/App.js` routes `/ai-optimization` to
  `client/src/pages/AIOptimization.js`, which contains a tools array
  with explicit `endpoint` mappings to `/ai/segment-optimize`,
  `/ai/send-time-optimize`, and `/ai/churn-detection`.
- Calls go through `client/src/api.js` (axios wrapper) which attaches
  the JWT from `localStorage` to every request.
- Pre-existing `AITools` and `AIHistory` pages cover the older AI
  endpoints.
- Backend route registered via
  `app.use('/api/ai', require('./routes/ai'))` in `server/index.js`.

Status: FE already wired; LEFT-AS-IS.

## Apply pass 4 (mechanical backlog)

Implemented 2 mechanical backlog endpoints + matching FE tools in the
existing AI Center:

- `POST /api/ai/subscriber-prediction` (in `server/routes/ai.js`)
  forecasts engagement / opens / clicks / unsubscribes per subscriber
  and a cohort summary.
- `POST /api/ai/list-dedupe` (in `server/routes/ai.js`) groups
  duplicate / near-duplicate subscribers and surfaces normalization
  issues.

Both endpoints reuse `callOpenRouter`, `parseAIJson`, `persistResult`,
`auth`, `aiRateLimiter`, and the existing `ai_results` table. Both now
return HTTP 503 if `OPENROUTER_API_KEY` is missing (401 from upstream
or `api_key` in the error message).

Frontend: added two new tool cards (Subscriber Prediction, List Import
Dedupe) to the existing tools array in
`client/src/pages/AIOptimization.js`. JSON-array fields are parsed,
`horizon_days` is coerced to int, and 503 responses are surfaced as a
distinct error message. JWT bearer is attached by the existing
`client/src/api.js` wrapper.

Smoke test (backend on alt port 5901, due to other apps holding 3001):
- pkill prior listener -> start -> POST `/api/auth/login` (200, token) ->
  POST `/api/ai/list-dedupe` with sample (200 with structured AI JSON) ->
  POST `/api/ai/subscriber-prediction` with sample (200 with structured
  AI JSON) -> cleanup. PASS.

## Apply pass 5 (all backlog)

Implemented 5 additional AI endpoints in `server/routes/ai.js`,
covering the remaining custom-feature backlog and the items that map
naturally to AI generation:

- `POST /api/ai/agentic-campaign-orchestrate` — PRODUCT-DECISION:
  returns a multi-step plan only; never auto-sends.
- `POST /api/ai/batch-content-variants` — generates N variants for a
  brief (A/B testing).
- `POST /api/ai/vertical-template` — PRODUCT-DECISION: AI generates a
  reusable vertical template on demand instead of shipping a hardcoded
  template library.
- `POST /api/ai/dynamic-content-blocks` — per-segment block recommender
  enabling personalization without requiring schema changes.
- `POST /api/ai/realtime-subscriber-intel` — PRODUCT-DECISION: report
  endpoint, not a streaming pipeline; caller passes recent activity.

All reuse `callOpenRouter` + `parseAIJson` + `persistResult` + `auth` +
`aiRateLimiter`. Each returns 503 + `missing: OPENROUTER_API_KEY` if no
key is configured.

Frontend — extended the existing AI Center
(`client/src/pages/AIOptimization.js`) with 5 new tool cards (Campaign
Orchestrator, Batch Content Variants, Vertical Template, Dynamic Content
Blocks, Realtime Subscriber Intel) and broadened its JSON / int field
coercion to cover the new fields (`segments`, `tones`, `sections`,
`recent_activity`, `variant_count`, `time_horizon_days`).

Items NOT addressed:
- Preference center, GDPR/CAN-SPAM compliance tooling, full realtime
  analytics dashboard, vertical template "library" (NEEDS-PRODUCT-DECISION).
- CRM / Shopify / HubSpot integrations (NEEDS-CREDS).

Smoke test (backend on alt `PORT=5903`):
- pkill prior listener -> start -> POST `/api/auth/login` (200, token) ->
  POST `/api/ai/vertical-template` (200 with structured AI JSON) ->
  POST `/api/ai/batch-content-variants` (200 with structured AI JSON) ->
  cleanup. PASS.
