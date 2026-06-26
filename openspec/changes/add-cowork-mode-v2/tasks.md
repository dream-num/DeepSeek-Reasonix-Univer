## 1. Protocol And Dependency Alignment

- [ ] 1.1 Confirm the matching Univer CLI OpenSpec defines `@univer/cowork` exports, Cowork Protocol Version, gateway endpoint discovery, and compatibility behavior.
- [ ] 1.2 Add the Univer Cowork package dependency to the desktop frontend behind a narrow integration boundary.
- [ ] 1.3 Define Reasonix-side Cowork target, unit, worktree, capability, incompatibility, and transcript block types aligned with `@univer/collab-gateway-contract`.
- [ ] 1.4 Add protocol-version and capability validation before rendering Cowork components.

## 2. Host Adapter And Tooling Session

- [ ] 2.1 Add Go bridge methods for Cowork tooling discovery, daemon start/status, gateway health, and protocol metadata.
- [ ] 2.2 Implement the Reasonix Cowork host adapter in the frontend.
- [ ] 2.3 Route host-owned Cowork intents through Reasonix approvals and bridge calls rather than frontend shell execution.
- [ ] 2.4 Add typed Cowork capability failure and incompatibility states.

## 3. Cowork Activity And Shell

- [ ] 3.1 Add Code/Cowork workspace activity switching.
- [ ] 3.2 Add Cowork session persistence and restore behavior.
- [ ] 3.3 Implement the transcript-first Cowork shell layout with transcript, target status, and focused Univer work regions.
- [ ] 3.4 Embed Univer Cowork components and headless primitives through the host adapter.
- [ ] 3.5 Define and implement office-native Cowork information architecture, including session/document/draft/review hierarchy and non-developer primary copy.

## 4. Target And Worktree Workflow

- [ ] 4.1 Create Cowork targets from workspace `.univer` files and agent activity using host-defined display/source identity.
- [ ] 4.2 Implement trunk/worktree/merge-preview scope selection for the active target.
- [ ] 4.3 Render worktree status for `open`, `ready`, `merged`, and `discarded`.
- [ ] 4.4 Map gateway worktree statuses to office draft labels while preserving canonical statuses internally.
- [ ] 4.5 Implement ready-worktree merge flow, mapping user-facing apply draft or accept changes copy to the gateway `merge` operation.
- [ ] 4.6 Implement discard flow with Reasonix approval and gateway `discard` execution.
- [ ] 4.7 Display merge preview divergence and conflict results from Univer tooling using plain-language review and needs-your-decision states.

## 5. Transcript Blocks

- [ ] 5.1 Add serializable Cowork Block schemas for target, worktree status, action result, and capability failure blocks.
- [ ] 5.2 Generate Cowork Blocks only from host/tooling evidence.
- [ ] 5.3 Restore Cowork Blocks when reopening Cowork sessions.
- [ ] 5.4 Render Cowork Blocks as document milestones and review decision surfaces rather than raw tool logs.

## 6. V1 Preview Migration

- [ ] 6.1 Route Workspace `.univer` entries to Cowork instead of V1 Live Univer Preview.
- [ ] 6.2 Add Code activity handoff entry points into Cowork for `.univer` artifacts.
- [ ] 6.3 Remove V1 Live Univer Preview provider, iframe surface, preview signal inference, and preview-specific code after Cowork coverage is in place.
- [ ] 6.4 Replace V1 preview tests with Cowork activity, target, failure, worktree, merge, and discard tests.

## 7. Verification

- [ ] 7.1 Run frontend typecheck and tests for Cowork shell, activity switching, target state, and transcript blocks.
- [ ] 7.2 Run Go tests for Cowork bridge/tooling discovery.
- [ ] 7.3 Smoke test with a gateway-created `.univer`: daemon status, Cowork target open, trunk render, worktree open, ready, merge, discard, and conflict display.
- [ ] 7.4 Validate the OpenSpec change with strict validation.
