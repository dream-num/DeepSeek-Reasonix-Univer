## Why

Reasonix V1 Live Univer Preview embeds the standalone Collab Client, which is enough for watching a `.univer` file but not enough for a native Uniwork workflow around agents, transcript blocks, worktree decisions, and desktop process orchestration. The V2 Uniwork workflow is for office workers collaborating on documents, spreadsheets, and slides with an agent, so it needs task-oriented document UX rather than developer-oriented preview or CLI language. Univer CLI now has concrete `packages/collab*` contracts for gateway, worktree, merge, discard, lifecycle events, and runtime configuration, so Reasonix V2 can integrate those surfaces without inventing a parallel collaboration model.

## What Changes

- Add a dedicated Uniwork workspace activity alongside the existing Code activity.
- Introduce a transcript-first Uniwork shell that can embed Univer-provided Uniwork components in the transcript, sidebar, panels, and focused work area while presenting office-native document collaboration UX.
- Separate Uniwork project orientation from selected-task review: the project bar orients the user to the current project/target, the project tree presents sessions as tasks, and the right rail appears only for reviewable selected-task state.
- Treat a Uniwork task as the user-visible work item and an agent run as an execution attempt under that task, so users manage tasks rather than agent processes.
- Translate gateway/worktree terminology into user-facing document draft language such as draft, ready for review, applied, discarded, review changes, apply draft, keep editing, and discard draft.
- Consume a Univer-owned frontend package, expected to be `@univer/uniwork`, with host-neutral React components, headless primitives, and typed intents.
- Add a Reasonix Uniwork host adapter that maps Univer package intents to Reasonix workspace state, approvals, Go bridge calls, and local `univer` executable or daemon orchestration.
- Align Uniwork targets, units, worktrees, and actions with `@univer/collab-gateway-contract` concepts: trunk/worktree scope, `WorktreeStatus`, `WorktreeControlClient` operations, lifecycle SSE, and collaboration runtime config.
- Support the V2 worktree path for status, open, ready, merge, discard, merge preview, and conflict display through Univer tooling authority.
- Persist host-generated Uniwork Blocks in the transcript for targets, worktree state, action results, and capability failures.
- Render Uniwork Blocks as document milestones and decision surfaces instead of raw tool logs or developer diagnostics.
- Specify Uniwork Block fields, visual hierarchy, state copy, and first-screen layout states for the office-native Uniwork shell.
- **BREAKING**: remove the V1 Live Univer Preview iframe path after Uniwork Mode is implemented; `.univer` work should route to Uniwork rather than Code preview.

## Capabilities

### New Capabilities

- `uniwork-mode`: Reasonix Uniwork activity, shell, host adapter, transcript blocks, Univer target/session orchestration, and gateway worktree UX.

### Modified Capabilities

- None.

## Impact

- Desktop Go bridge gains Uniwork-specific Univer tooling/session orchestration and action execution paths.
- Desktop frontend gains Uniwork activity switching, session persistence, Uniwork shell layout, transcript block rendering, and `@univer/uniwork` integration.
- Existing V1 Live Univer Preview UI, signal inference, iframe embedding, and preview-specific tests are removed or migrated to Uniwork entry behavior.
- Reasonix depends on a Univer-published package and shared protocol version rather than a submodule or copied collab implementation.
- Cross-repo coordination is required with the Univer CLI OpenSpec for `@univer/uniwork`, protocol versioning, package exports, and daemon/gateway status contracts.
