# Platform contracts

## Trusted practice

The browser calls `platform_action(p_action, p_payload)` using its authenticated session. The function derives the user from `auth.uid()`; client-supplied scores, XP, ownership, and role grants are never accepted.

- `start_practice`: accepts `lessonId` and optional `releaseId`. Validates publication ancestry and game eligibility. Snapshots exercises and private solutions; returns public questions and a server-issued run ID.
- `answer`: accepts `runId`, `exerciseId`, and a text/array answer. Validates ownership and checks the private solution. The first submitted answer is final; retries return the same feedback.
- `finish_practice`: requires every exercise answered. Saves accuracy and attempts atomically, applies rewards and achievements/quests, and returns the stored result on retries.

A lesson completes at 80% accuracy and grants its XP once. Games save verified scores based on correct answers and grant XP once per release per UTC day. Completing a review still records activity without duplicating XP. Streaks use the learner's saved timezone; daily minutes use elapsed server time capped at 60 minutes per completed run. Runs expire after 24 hours and starts are capped at 100 per rolling day.

The built-in renderer supports choice, typing, and word order, with aliases for translation/fill-blank/grammar-choice/true-false/sentence-builder. These aliases use the same corresponding answer interaction. Unsupported exercises prevent a session from starting.

The browser games currently share the practice challenge engine. Independent game executables, multiplayer verification, and a Godot protocol remain future work.

## Avatar definition v1

```json
{
  "schemaVersion": 1,
  "avatarId": "owner-avatar-uuid",
  "modelFamily": "humanoid-v1",
  "selections": [
    {"slot":"body","assetKey":"body.traveler","assetVersion":1,"options":{"tint":"#deb99e"}},
    {"slot":"hair","assetKey":"hair.soft-bob","assetVersion":1,"options":{"tint":"#343735"}},
    {"slot":"top","assetKey":"top.academy-jacket","assetVersion":1,"options":{"tint":"#747e69"}}
  ]
}
```

`avatarRepository` loads the published catalog, entitlements, primary avatar, and equipment. `save_avatar` resolves stable keys/version numbers and checks ownership, free/unlocked status, model compatibility, slot compatibility, and appearance options in one transaction. It returns the persistent avatar UUID. A draft starts with built-in colors; it becomes account data only on successful save.

The web renderer currently supports the built-in body/hair/top styles and tint palette. Database catalog support is broader than the renderer; uploading another manifest does not automatically provide a new visual implementation. Production models, animations, Godot/native manifest resolution and expanded inventory UI remain future work.

## AI conversations

`open_conversation(p_scenario, p_new)` resumes or creates an owned session for a published character/scenario. Message history is readable only by the session owner.

The browser invokes `ai-conversation` with `{sessionId, requestId, message}`. The Edge Function validates the access token with Supabase Auth, then calls the service-only reservation function. Reservations enforce ownership, one pending request, a rolling daily quota, and idempotency before billing. Only the service can commit a provider response. Committing both messages and one affinity increment is atomic; retries do not repeat either.

Provider/model/keys are server secrets. OpenAI uses Responses with `store:false`; Gemini uses generateContent. Text is rendered as text, never executable HTML. Replies are not assessments and do not award XP. See [Live setup](LIVE_SETUP.md) for context limits, retention behavior and deployment.

## Workbooks

`generate_material` accepts a published template UUID. It selects published exercises at that template's language/CEFR level, includes the private solutions intentionally in the owner's offline answer sheet, and saves a ready material referencing that template version. Limit: 20 per rolling day, up to 50 questions per workbook. Fewer questions are used when the catalog has fewer matching exercises.

The current document renderer displays practice and an answer sheet. Template sections are retained as metadata; arbitrary theory/examples sections are not synthesized. Browser print supplies **Save as PDF** with Unicode-capable fonts. There is no background AI generation job or stored binary PDF yet.

## Community and publishing

Room membership/capacity and assessed CEFR requirements are checked by trusted functions. Chat reads/sends require current membership; messages are bounded and sending is rate-limited. Text updates poll every eight seconds. Voice/event room integrations remain unavailable.

Rankings aggregate actual progression events and expose only opted-in public profile names/usernames and XP. They never expose account emails or private progress tables.

Opportunities read only published non-demo records. External application links require HTTPS. The platform does not transact bookings or payments.

Catalog edits use RLS admin policies. Exercises and private solutions are edited atomically by an admin-only RPC. Published asset/template versions are immutable; editors create a new draft version. Admins can inspect a bounded learner overview but cannot grant roles or alter authoritative progress from the browser.
