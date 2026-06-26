## Context

Reasonix V1 `add-live-univer-preview` is intentionally thin: it discovers `univer daemon status --json`, reads `collabGateway.viewUrl`, and embeds the daemon-served Collab Client iframe for a `.univer` path. That keeps Reasonix out of Univer collaboration internals, but it also makes Univer work feel like a preview bolted onto the Code workspace.

The V2 Cowork direction is different. Reasonix should provide a native workspace activity and transcript-first shell, while Univer tooling owns document semantics, collab state, worktree operations, and embeddable Univer UI. The current `univer-cli` `origin/dev` branch already has the relevant source-of-truth packages:

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

- Add Reasonix Cowork as a first-class workspace activity next to Code.
- Keep Reasonix shell ownership separate from Univer document semantics.
- Consume a Univer-published Cowork package and shared protocol rather than copying collab code or embedding a repository submodule.
- Let `@univer/cowork` render focused Univer surfaces and expose headless primitives while Reasonix controls layout, transcript, approvals, and process orchestration.
- Ground worktree UI in existing `collab-gateway-contract` types and gateway behavior.
- Replace V1 iframe preview as the primary `.univer` workflow once Cowork is complete.

**Non-Goals:**

- Do not implement a Univer document engine, OT, snapshot reader, or gateway in Reasonix.
- Do not redefine worktree lifecycle states or merge/discard semantics in Reasonix.
- Do not require a structured cell/doc diff in V2; use merge preview/status/conflict data exposed by Univer tooling.
- Do not build base-table, remote collaboration, permission, or object-storage features in Reasonix.
- Do not make `@univer/cowork` Reasonix-specific.

## Decisions

### 1. Cowork is a Reasonix workspace activity, not a Code preview panel

Reasonix will add a Code/Cowork activity switch. The active activity determines the shell for new sessions, and Cowork sessions restore into the Cowork shell from recents. Existing Code sessions remain Code sessions.

Alternatives considered:

- Ask the user to choose Code vs Cowork every time a session is created. Rejected because it adds friction and duplicates the activity switch.
- Keep `.univer` preview inside Code. Rejected because `.univer` work is not the recommended primary path once Cowork exists.

### 2. The Cowork shell stays transcript-first

Reasonix owns the Cowork shell: transcript, session lifecycle, sidebar, focused work area, command affordances, and recovery states. Univer-provided components can appear inside the transcript, sidebar, and focus area, but they do not become the entire desktop layout.

Alternatives considered:

- Make Cowork a full document editor layout. Rejected for V2 because the agent conversation remains the primary workflow and because tighter coupling would increase upstream rebase conflicts.
- Keep only one embedded iframe. Rejected because it cannot support native transcript blocks, worktree state, or host approvals.

### 3. `@univer/cowork` is the single frontend integration package

The Univer CLI repository should publish one Cowork package, expected as `@univer/cowork`, with subpath exports for React components, headless primitives, and contract types. The package may internally depend on `@univer/collab-gateway-contract` and Univer collaboration client code.

Reasonix imports the package, implements the host adapter, and passes Cowork targets and host capabilities. Reasonix does not import `packages/collab-client` as a standalone app.

Alternatives considered:

- Split components and contracts into multiple public packages. Rejected for V2 because one package is simpler for consumers; subpath exports can still keep entrypoints small.
- Use a git submodule. Rejected because release/versioning should follow Univer tooling package publication.

### 4. The host adapter uses control inversion

`@univer/cowork` must be host-neutral. It receives a host adapter for target authority, action execution, approvals, environment/capability reporting, and optional logging hooks. The package may provide default headless logic for gateway reads, but host-owned operations still flow through typed intents or adapter methods.

Reasonix's adapter lives in the Reasonix repository and maps those requests to:

- Wails/Go bridge calls.
- Univer executable discovery.
- Daemon start/status checks.
- Gateway origin/session data.
- Reasonix approvals and transcript block creation.

Alternatives considered:

- Let the package call arbitrary shell commands or own daemon lifecycle. Rejected because it would bind the package to one desktop host and bypass Reasonix permissions.
- Put the Reasonix adapter in the Univer package. Rejected because the adapter depends on Reasonix workspace, bridge, and session state.

### 5. Cowork target state follows the gateway contract

Reasonix Cowork targets carry enough information to render and operate on a `.univer` file without the package discovering host state on its own:

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

### 6. Worktree UX maps to existing gateway operations

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

### 7. Lifecycle events remain Univer-owned

Univer gateway SSE events remain the source for worktree registry/status, reset, and unit add/remove. Cowork components may subscribe directly through Univer package logic when a Gateway Endpoint is available, but transcript persistence is Reasonix-owned: only host-generated Cowork Blocks become session records.

Alternatives considered:

- Persist every daemon or SSE event into transcript. Rejected because most lifecycle noise is operational state, not user-level conversation history.
- Proxy all Gateway traffic through Go by default. Rejected unless required by security/policy, because the existing browser client path already uses local HTTP/WS/SSE.

### 8. V1 Live Univer Preview is removed after Cowork ships

When Cowork Mode satisfies the `.univer` workflow, the V1 preview iframe and Code-activity preview routing should be removed. Code may still offer a route into Cowork for `.univer` files, but it should not present document/spreadsheet/slide work as a Code preview.

Alternatives considered:

- Keep V1 preview as fallback. Rejected because it creates two competing `.univer` workflows and preserves iframe-specific edge cases.

## Risks / Trade-offs

- Protocol drift between Reasonix and Univer packages -> Mitigate with explicit Cowork Protocol Version negotiation and package peer/version checks.
- Local path exposure through browser URLs -> Mitigate by keeping paths local-only, redacting diagnostics, and preferring host display paths in persisted state.
- Gateway unavailable or stale -> Mitigate with typed capability failures, retry, and Go bridge diagnostics rather than transcript errors.
- Worktree action ambiguity in UI copy -> Mitigate by keeping protocol names in adapter contracts and mapping user-facing "accept" copy to `merge` in one place.
- Frontend package overreach into host state -> Mitigate by requiring host adapter inversion and limiting package authority to render/headless component logic.
- V1 removal regression -> Mitigate with an explicit migration task list and tests proving `.univer` entries route to Cowork.

## Migration Plan

1. Add Cowork activity/session scaffolding without removing V1 preview.
2. Add Reasonix Cowork host adapter and bridge methods for Univer tooling session discovery.
3. Integrate `@univer/cowork` behind a feature flag or guarded dependency boundary.
4. Implement transcript Cowork Blocks and worktree action flows.
5. Route `.univer` workspace entries to Cowork and keep Code entry as a handoff to Cowork.
6. Remove V1 Live Univer Preview code and tests once Cowork has equivalent entry/error coverage.
7. Validate with the matching Univer CLI OpenSpec and a gateway-created `.univer` smoke.

## Open Questions

- What exact daemon status JSON fields will expose Cowork Protocol Version, gateway origin, and packaged Cowork asset/package compatibility?
- Does `@univer/cowork` perform gateway HTTP/SSE subscriptions directly in the browser, or does it require a host-provided transport adapter for all network calls?
- Which unit types are enabled for the first Reasonix V2 release if Univer gateway support differs between doc, sheet, and slide at release time?
