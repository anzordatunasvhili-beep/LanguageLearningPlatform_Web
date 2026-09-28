# Portable contracts and future integration

## Avatar definition v1

The avatar is a player resource, independent of the user's auth credentials and public portrait. The preview uses a small local asset catalog; production writes must resolve permitted catalog versions and owned/free cosmetics in Postgres.

```json
{
  "schemaVersion": 1,
  "avatarId": "local-explorer",
  "modelFamily": "humanoid-v1",
  "selections": [
    { "slot": "body", "assetKey": "body.traveler", "assetVersion": 1, "options": { "tint": "#deb99e" } },
    { "slot": "hair", "assetKey": "hair.soft-bob", "assetVersion": 1, "options": { "tint": "#343735" } },
    { "slot": "top", "assetKey": "top.academy-jacket", "assetVersion": 1, "options": { "tint": "#747e69" } }
  ]
}
```

`src/services/avatarService.js` validates the limited preview schema and exports only allowlisted fields. This uses the same portable `assetKey`, `assetVersion`, and `options.tint` contract as [DATABASE.md](DATABASE.md#portable-avatar-contract). The preview supports three required slots and a limited tint palette; the database can support additional catalog slots and optional six-digit hex tints. The local `avatarId` is an honest preview identifier; production uses a player-owned UUID. Asset keys and versions resolve to the immutable catalog revisions in the migrations. Do not upload this sample JSON as an unchecked database row. Add an explicit resolution layer that validates ownership and compatibility and returns each client's manifest. UI appearance controls map skin to `body` and clothing to `top`; renderer props remain independent of the portable slots.

TODO: Godot and mobile resolve the same stable asset identity to their own resource paths. Add schema migrations, platform compatibility/version negotiation, inventory, body families, modular clothing, proportions/morph limits, and optional renderer-specific fallbacks. Never put a React component name or Three.js object into the portable definition. Signing in does not make client-supplied cosmetic ownership trustworthy.

## Character presentation

`CharacterRenderer({ mode, appearance, name, emotion })` is the current rendering seam. `mode='2d'` renders a code-native placeholder portrait; `mode='3d'` lazy-loads the Three.js scene. The avatar and character conversation pages consume the same interface. The normal app does not import Three.js eagerly.

Future presentation states are allowlisted enums, such as `emotion: neutral|happy|thinking`, `pose: relaxed|arms_crossed`, `animation: idle_neutral|talking_01`, `camera: medium_closeup`. A provider response must be validated and mapped to a supported state; it cannot supply model URLs or arbitrary animation code. TODO: model loader/cache, rig adapter, lighting/camera presets, clip transitions, facial animation, TTS/lip sync. Provide graceful WebGL and missing-asset fallback.

## Conversation service

The current `aiService.respond({ characterId, turn, message })` returns `{ text, translation, options, emotion, provider }` from a fixed local script. The UI labels this limitation, and the service accepts no API key. Conversation state is bounded to one current line and one previous reply.

TODO: replace with an authenticated backend adapter using durable session IDs, language/goal/scenario configuration, bounded memory summaries, moderation and retention policy, prompt-injection-resistant structured output validation, provider timeouts, rate limits, and controlled token budgets. Relationship changes require a trusted transaction. Never return provider secrets or internal prompts to the client. Store transcript objects privately; generated/context history cannot grow indefinitely in frontend state.

## Game result submission

Games are clients of the platform. Future request shape:

```json
{
  "schemaVersion": 1,
  "sessionId": "server-issued-session-uuid",
  "releaseId": "catalog-release-uuid",
  "idempotencyKey": "unique-submission-uuid",
  "result": { "score": 120, "correct": 8, "attempted": 10, "durationMs": 60000 }
}
```

Do not accept authoritative XP, unlocks, server timestamps, or arbitrary user IDs. The backend identifies the user from the access token, verifies the session/release, validates bounded evidence and eligibility, detects replays, then atomically writes a verified session, a deduplicated progression event, and aggregates. TODO: abuse controls, per-game validation, Godot PKCE/deep links, app/device compatibility, offline submissions and reconciliation. No networking endpoint or fake downloadable game is implemented yet.

## Exercise engine

Exercises are data addressed by stable IDs and types. `ExerciseRenderer` currently supports `multiple_choice`, `typing`, and `word_order`; unknown types produce a clear unavailable state. Local grading only supports formative sample practice. Answer keys in fixtures are intentionally visible and cannot secure rewards.

TODO: add a server grading boundary with published content versions and private answer keys; validate attempt ownership, content ancestry and request bounds. Extend the renderer registry with matching, fill-blank, listening, speaking, image-choice and boss-test components as their actual learning behavior is defined. Do not make client-only tests competitive.

## PDF generation

Admin templates constrain language, level, sections, exercise types, question counts, instructions and answer behavior. Current UI edits an in-memory sample and previews its structure. It does not generate or download a PDF.

TODO: immutable published template versions, a validated generation request, queued server jobs, provider output schema validation, pedagogical review, deterministic PDF rendering, job failure/retry states, private storage, short-lived signed downloads and retention/deletion. Generated material metadata must reference the exact template version. Payment or quota enforcement belongs on the backend.

## Public discovery, rooms, and rankings

Opportunity samples are fictional and marked as such. TODO: verified sources, currency/date/availability freshness, eligibility semantics and moderation before real catalog launch. Tours booking/payment is a separate future project.

Rooms browse only. TODO: trusted language-level entry checks, membership lifecycle, moderation, realtime authorization, voice/streaming safety and privacy. Rankings currently contain sample players; future public ranking projections should expose only opted-in profile fields and verified metrics. Private account progress should not become publicly readable just to support a leaderboard.
