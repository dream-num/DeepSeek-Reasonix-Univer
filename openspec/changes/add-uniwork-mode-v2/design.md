## Context

Reasonix V1 `add-live-univer-preview` is intentionally thin: it discovers `univer daemon status --json`, reads `collabGateway.viewUrl`, and embeds the daemon-served Collab Client iframe for a `.univer` path. That keeps Reasonix out of Univer collaboration internals, but it also makes Univer work feel like a preview bolted onto the Code workspace.

The V2 Uniwork direction is different. Reasonix should provide a native workspace activity and transcript-first shell for office workers collaborating with an agent on documents, spreadsheets, and slides, while Univer tooling owns document semantics, collab state, worktree operations, and embeddable Univer UI. The current `univer-cli` `origin/dev` branch already has the relevant source-of-truth packages:

- `packages/collab-gateway-contract`: shared `WorktreeStatus`, unit type constants, `WorktreeControlClient`, `buildRuntimeConfig`, merge preview types, lifecycle SSE event types, and `.univer` path encoding.
- `packages/collab-gateway`: daemon-owned local gateway for `/uf/<enc>` API, snapshot HTTP, comb WS, lifecycle SSE, and worktree control-plane operations.
- `packages/collab-client`: browser client proving trunk/worktree render, read-only worktree viewing, merge preview rendering, merge/discard UI, and reset rebuild behavior.

Important existing gateway semantics:

- Worktree statuses are `"open" | "ready" | "merged" | "discarded"`.
- Control operations are `createWorktree`, `commit`, `rollback`, `ready`, `merge`, `discard`, `previewMerge`, and `getMergePreviewUnit`.
- `merge` is the protocol operation for accepting a ready worktree into trunk; UI copy can say accept, but the host must map to `merge`.
- `discard` drops worktree data and leaves trunk untouched.
- `rollback` emits a `reset` SSE because comb is append-only; viewers must rebuild the Univer instance.
- Merge conflicts are business responses, not transport failures: `ok:false`, `conflict:true`, `failedUnit`.
- The daemon-owned gateway serves API, WS/SSE, and packaged view assets from one local listener.

## Goals / Non-Goals

**Goals:**

- Add Reasonix Uniwork as a first-class workspace activity next to Code.
- Make Uniwork feel like an office-native document collaboration workspace rather than a developer preview, terminal, or code review surface.
- Keep Reasonix shell ownership separate from Univer document semantics.
- Consume a Univer-published Uniwork package and shared protocol rather than copying collab code or embedding a repository submodule.
- Let `@univer/uniwork` render focused Univer surfaces and expose headless primitives while Reasonix controls layout, transcript, approvals, and process orchestration.
- Ground worktree UI in existing `collab-gateway-contract` types and gateway behavior.
- Replace V1 iframe preview as the primary `.univer` workflow once Uniwork is complete.

**Non-Goals:**

- Do not implement a Univer document engine, OT, snapshot reader, or gateway in Reasonix.
- Do not redefine worktree lifecycle states or merge/discard semantics in Reasonix.
- Do not require a structured cell/doc diff in V2; use merge preview/status/conflict data exposed by Univer tooling.
- Do not build base-table, remote collaboration, permission, or object-storage features in Reasonix.
- Do not make `@univer/uniwork` Reasonix-specific.
- Do not expose CLI, daemon, gateway, worktree, merge, or protocol terminology as the primary user-facing language for office users.

## Decisions

### 1. Uniwork is a Reasonix workspace activity, not a Code preview panel

Reasonix will add a Code/Uniwork activity switch. The active activity determines the shell for new sessions, and Uniwork sessions restore into the Uniwork shell from recents. Existing Code sessions remain Code sessions.

Alternatives considered:

- Ask the user to choose Code vs Uniwork every time a session is created. Rejected because it adds friction and duplicates the activity switch.
- Keep `.univer` preview inside Code. Rejected because `.univer` work is not the recommended primary path once Uniwork exists.

### 2. Uniwork is designed for office workers, not developers

Uniwork is for users who think in documents, spreadsheets, slides, drafts, reviews, and decisions. The UI should avoid developer-density, terminal styling, raw protocol state, JSON, logs, and CLI-oriented diagnostics in the primary path. Reasonix may keep technical details available for debugging, but the main Uniwork surfaces should use office-native copy and task-oriented affordances.

User-facing labels should translate the underlying gateway model:

- `open` worktree -> draft in progress.
- `ready` worktree -> ready for review.
- `merge` operation -> apply draft or accept changes.
- merge preview -> review changes.
- merge conflict -> needs your decision.
- `merged` worktree -> applied.
- `discarded` worktree -> discarded draft.

Alternatives considered:

- Reuse Code-mode density and technical language. Rejected because Uniwork is not the recommended path for coding work; it is the primary path for document, spreadsheet, and slide work.
- Hide the worktree model completely. Rejected because users still need clear review, apply, discard, and recovery decisions, even if the protocol names stay behind the adapter boundary.

### 3. The Uniwork shell stays transcript-first

Reasonix owns the Uniwork shell: transcript, session lifecycle, sidebar, focused work area, command affordances, and recovery states. Univer-provided components can appear inside the transcript, sidebar, and focus area, but they do not become the entire desktop layout.

For office users, transcript-first does not mean chat-only. It means the transcript records the collaboration story while embedded Uniwork Blocks present document targets, draft milestones, review summaries, and decision actions in a structured way. The focused work area remains available for a larger Univer surface when the user needs to inspect the document itself.

Alternatives considered:

- Make Uniwork a full document editor layout. Rejected for V2 because the agent conversation remains the primary workflow and because tighter coupling would increase upstream rebase conflicts.
- Keep only one embedded iframe. Rejected because it cannot support native transcript blocks, worktree state, or host approvals.

### 4. `@univer/uniwork` is the single frontend integration package

The Univer CLI repository should publish one Uniwork package, expected as `@univer/uniwork`, with subpath exports for React components, headless primitives, and contract types. The package may internally depend on `@univer/collab-gateway-contract` and Univer collaboration client code.

Reasonix imports the package, implements the host adapter, and passes Uniwork targets and host capabilities. Reasonix does not import `packages/collab-client` as a standalone app.

Alternatives considered:

- Split components and contracts into multiple public packages. Rejected for V2 because one package is simpler for consumers; subpath exports can still keep entrypoints small.
- Use a git submodule. Rejected because release/versioning should follow Univer tooling package publication.

### 5. The host adapter uses control inversion

`@univer/uniwork` must be host-neutral. It receives a host adapter for target authority, action execution, approvals, environment/capability reporting, and optional logging hooks. The package may provide default headless logic for gateway reads, but host-owned operations still flow through typed intents or adapter methods.

Reasonix's adapter lives in the Reasonix repository and maps those requests to:

- Wails/Go bridge calls.
- Univer executable discovery.
- Daemon start/status checks.
- Gateway origin/session data.
- Reasonix approvals and transcript block creation.

Alternatives considered:

- Let the package call arbitrary shell commands or own daemon lifecycle. Rejected because it would bind the package to one desktop host and bypass Reasonix permissions.
- Put the Reasonix adapter in the Univer package. Rejected because the adapter depends on Reasonix workspace, bridge, and session state.

### 6. Uniwork target state follows the gateway contract

Reasonix Uniwork targets carry enough information to render and operate on a `.univer` file without the package discovering host state on its own:

- Host display identity and redacted display path.
- Tooling session status and protocol version.
- Gateway origin or endpoint data returned by the Univer daemon/tooling contract.
- Active scope: trunk, worktree, or merge preview.
- Active unit reference: unit id, type, name, head revision.
- Worktree summary where relevant: `worktreeId`, `status`, `baseline`, `headCommit`, `agentId`, `name`.
- Capability flags for supported unit types and actions.

The current gateway supports doc, sheet, and slide unit type constants in contract, with base reserved. Reasonix must expose only capabilities reported by Univer tooling for the active target.

Alternatives considered:

- Pass only a filesystem path to the surface. Rejected because path-only targets cannot express worktree scope, gateway health, unit type, or host capabilities.
- Store raw `/uf/<enc>` URLs as persistent target identity. Rejected because URL construction and path encoding belong to Univer tooling contracts, not Reasonix persistence.

### 7. Worktree UX maps to existing gateway operations

Reasonix UI copy may use user-facing words like accept, but the protocol operation is `merge`. The first V2 worktree UX includes:

- Show worktree status for `open`, `ready`, `merged`, and `discarded`.
- Open a worktree by selecting a target scope and unit, not by launching a separate viewer app.
- For `ready` worktrees, allow merge when `previewMerge.mergeable` is true.
- Show merge conflicts from `previewMerge.conflicts` or `MergeResponse.failedUnit`.
- Allow discard for non-terminal worktrees after Reasonix approval.
- Show merge preview/original toggles where Univer tooling reports divergence.

Alternatives considered:

- Design a Reasonix-specific accept/discard API. Rejected because `packages/collab*` already defines the canonical operations.
- Require structured diff for V2. Rejected because current gateway exposes merge preview, not a general structured diff model.

### 8. Uniwork information architecture follows document collaboration

The Uniwork shell should organize state around sessions, document targets, drafts, and review decisions:

- Activity switch: Code and Uniwork are separate primary modes.
- Uniwork sidebar: recent Uniwork sessions and document targets should be easier to scan than raw workspace files.
- Transcript: user requests, agent responses, and Uniwork milestone blocks remain the collaboration record.
- Focused work area: a selected `.univer` target, unit, draft, or merge preview can expand into a larger Univer surface.
- Review surfaces: ready drafts should show what changed, what needs attention, and the next safe actions before applying or discarding.

This does not require a separate full-screen document suite in V2. It refines the existing transcript-first design so an office worker can understand document status without learning the gateway model.

Alternatives considered:

- Keep the current Workspace file preview IA and only change the renderer. Rejected because a `.univer` workflow needs draft/review/action state, not just file selection.
- Make Uniwork a standalone review queue without transcript continuity. Rejected because Reasonix's core value is agent collaboration history and recoverable decisions.

### 9. Uniwork Blocks are structured office milestones

Uniwork Blocks are the native transcript objects that make `.univer` collaboration understandable and restorable. They should be generated only by Reasonix host code or Univer tooling evidence, not by arbitrary model-authored JSON.

Each block should carry a stable envelope:

- `blockId`: host-generated stable id.
- `schemaVersion`: Uniwork Block schema version for restoration.
- `kind`: `target`, `draftStatus`, `reviewRequest`, `actionResult`, or `capabilityFailure`.
- `createdAt`: host timestamp.
- `source`: `host` or `univer-tooling`.
- `targetRef`: host target id, display name, redacted display path, and source identity.
- `unitRef`: optional unit id, unit type, display name, and head revision.
- `scopeRef`: trunk, worktree, or merge preview scope.
- `status`: canonical protocol status where applicable plus user-facing status copy.
- `summary`: short office-language sentence for transcript scanning.
- `actions`: typed user actions that the host adapter can approve and execute.
- `diagnostics`: optional secondary technical details for troubleshooting.

Block kinds should serve distinct UX jobs:

- `target`: confirms which document, spreadsheet, or slide deck is now in Uniwork.
- `draftStatus`: shows whether a draft is in progress, ready for review, applied, or discarded.
- `reviewRequest`: asks the user to inspect changes, attention areas, or a decision point before applying.
- `actionResult`: records that a draft was applied, kept for editing, discarded, or failed.
- `capabilityFailure`: explains why Uniwork cannot proceed and offers recovery where possible.

Alternatives considered:

- Store raw gateway responses as transcript blocks. Rejected because that would leak implementation details and make future UI migration harder.
- Let the model author Uniwork Blocks directly. Rejected because transcript state must be backed by real host/tooling evidence.

### 10. Uniwork visual hierarchy favors decisions over diagnostics

Uniwork visual hierarchy should make the next office decision obvious before showing implementation detail:

1. Active document identity and user-facing status.
2. What changed or what the agent is doing.
3. What needs attention or review.
4. Primary safe action, usually open, review changes, apply draft, keep editing, or discard draft.
5. Secondary diagnostics, protocol names, revisions, or gateway details.

Transcript Uniwork Blocks should read as compact milestones by default. A milestone shows title, target, status badge, one-sentence summary, and up to two primary actions. Expanded details can show unit, scope, revision, capability flags, and diagnostics, but those details should not dominate the default view.

Focused Uniwork surfaces can be larger and more document-like: document header, unit switcher, draft status, review summary, and the Univer-rendered content. They should avoid terminal/log styling and should keep plain-language actions visible near the document.

### 11. First Uniwork screen is a document workspace, not an empty chat

When Uniwork is opened without an active target, the shell should help an office user start from work objects:

- Activity switch: Code and Uniwork, with Uniwork active.
- Uniwork sidebar: recent Uniwork sessions, recent document targets, and ready-for-review drafts where available.
- Transcript: a concise empty state explaining that the user can ask the agent to work on a document, spreadsheet, or slide deck.
- Primary actions: open a `.univer` file, continue a recent Uniwork session, or review a ready draft.
- Focused work area: a neutral document-workspace placeholder, not a blank code preview.

When a target is active, first-screen priority changes:

- Sidebar keeps session/document navigation.
- Transcript shows the latest user request, agent response, and the current Uniwork Block milestone.
- Focused work area shows the selected unit or review surface.
- Composer remains available for natural-language document requests.

This keeps Reasonix's existing shell model while making Uniwork feel like a native office collaboration mode.

### 12. State copy is part of the product contract

The first V2 copy set should be stable enough for localization and tests:

- Empty target: "Open a document, spreadsheet, or slide deck to start Uniwork."
- Opening target: "Opening document..."
- Target ready: "Ready to work on this document."
- Draft in progress: "Draft in progress."
- Ready for review: "Ready for your review."
- Review changes: "Review changes."
- Apply draft: "Apply draft."
- Keep editing: "Keep editing."
- Discard draft: "Discard draft."
- Applied: "Draft applied."
- Discarded: "Draft discarded."
- Needs decision: "Needs your decision."
- Tooling unavailable: "Uniwork cannot open this document right now."
- Incompatible protocol: "This document needs a newer Uniwork integration."

Protocol names such as `merge`, `worktree`, `daemon`, and `gateway` may appear in secondary diagnostics, developer logs, or copied error details, but not as the main visible title or action label for office users.

### 13. Lifecycle events remain Univer-owned

Univer gateway SSE events remain the source for worktree registry/status, reset, and unit add/remove. Uniwork components may subscribe directly through Univer package logic when a Gateway Endpoint is available, but transcript persistence is Reasonix-owned: only host-generated Uniwork Blocks become session records.

Alternatives considered:

- Persist every daemon or SSE event into transcript. Rejected because most lifecycle noise is operational state, not user-level conversation history.
- Proxy all Gateway traffic through Go by default. Rejected unless required by security/policy, because the existing browser client path already uses local HTTP/WS/SSE.

### 14. V1 Live Univer Preview is removed after Uniwork ships

When Uniwork Mode satisfies the `.univer` workflow, the V1 preview iframe and Code-activity preview routing should be removed. Code may still offer a route into Uniwork for `.univer` files, but it should not present document/spreadsheet/slide work as a Code preview.

Alternatives considered:

- Keep V1 preview as fallback. Rejected because it creates two competing `.univer` workflows and preserves iframe-specific edge cases.

## Risks / Trade-offs

- Protocol drift between Reasonix and Univer packages -> Mitigate with explicit Uniwork Protocol Version negotiation and package peer/version checks.
- Local path exposure through browser URLs -> Mitigate by keeping paths local-only, redacting diagnostics, and preferring host display paths in persisted state.
- Gateway unavailable or stale -> Mitigate with typed capability failures, retry, and Go bridge diagnostics rather than transcript errors.
- Office-user confusion from protocol language -> Mitigate with a stable user-facing vocabulary layer and optional technical details only where diagnostics require them.
- Uniwork Blocks becoming noisy transcript clutter -> Mitigate with milestone-level block creation, compact default rendering, and details hidden behind disclosure.
- Worktree action ambiguity in UI copy -> Mitigate by keeping protocol names in adapter contracts and mapping user-facing "accept" copy to `merge` in one place.
- Frontend package overreach into host state -> Mitigate by requiring host adapter inversion and limiting package authority to render/headless component logic.
- V1 removal regression -> Mitigate with an explicit migration task list and tests proving `.univer` entries route to Uniwork.

## Migration Plan

1. Add Uniwork activity/session scaffolding without removing V1 preview.
2. Add Reasonix Uniwork host adapter and bridge methods for Univer tooling session discovery.
3. Integrate `@univer/uniwork` behind a feature flag or guarded dependency boundary.
4. Implement office-native Uniwork shell IA, vocabulary mapping, transcript Uniwork Blocks, and worktree action flows.
5. Route `.univer` workspace entries to Uniwork and keep Code entry as a handoff to Uniwork.
6. Remove V1 Live Univer Preview code and tests once Uniwork has equivalent entry/error coverage.
7. Validate with the matching Univer CLI OpenSpec and a gateway-created `.univer` smoke.

## Open Questions

- What exact daemon status JSON fields will expose Uniwork Protocol Version, gateway origin, and packaged Uniwork asset/package compatibility?
- Does `@univer/uniwork` perform gateway HTTP/SSE subscriptions directly in the browser, or does it require a host-provided transport adapter for all network calls?
- Which unit types are enabled for the first Reasonix V2 release if Univer gateway support differs between doc, sheet, and slide at release time?
- Which exact office-language labels should be localized for draft status, review actions, conflict decisions, and capability failures before implementation starts?
