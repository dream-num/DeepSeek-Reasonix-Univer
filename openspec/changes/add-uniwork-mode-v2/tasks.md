## 1. Protocol And Dependency Alignment

- [ ] 1.1 Confirm the matching Univer CLI OpenSpec defines `@univer/uniwork` exports, Uniwork Protocol Version, gateway endpoint discovery, and compatibility behavior.
- [ ] 1.2 Add the Univer Uniwork package dependency to the desktop frontend behind a narrow integration boundary.
- [ ] 1.3 Define Reasonix-side Uniwork target, unit, worktree, capability, incompatibility, and transcript block types aligned with `@univer/collab-gateway-contract`.
- [ ] 1.4 Add protocol-version and capability validation before rendering Uniwork components.

## 2. Host Adapter And Tooling Session

- [ ] 2.1 Add Go bridge methods for Uniwork tooling discovery, daemon start/status, gateway health, and protocol metadata.
- [ ] 2.2 Implement the Reasonix Uniwork host adapter in the frontend.
- [ ] 2.3 Route host-owned Uniwork intents through Reasonix approvals and bridge calls rather than frontend shell execution.
- [ ] 2.4 Add typed Uniwork capability failure and incompatibility states.

## 3. Uniwork Activity And Shell

- [ ] 3.1 Add Code/Uniwork workspace activity switching.
- [ ] 3.2 Add Uniwork session persistence and restore behavior.
- [ ] 3.3 Implement the transcript-first Uniwork shell layout with transcript, target status, and focused Univer work regions.
- [ ] 3.4 Embed Univer Uniwork components and headless primitives through the host adapter.
- [ ] 3.5 Define and implement office-native Uniwork information architecture, including session/document/draft/review hierarchy and non-developer primary copy.
- [ ] 3.6 Implement the Uniwork first screen for no-target, recent-session, ready-draft, and active-target states.
- [ ] 3.7 Apply Uniwork visual hierarchy rules for transcript milestones, focused document surfaces, review panels, and expandable diagnostics.
- [ ] 3.8 Implement the Uniwork Project Bar for project/target orientation, active target display, target navigator entry, and low-key gateway or sync health.
- [ ] 3.9 Implement the Uniwork Target Navigator as a project-bar popover for current target files, units, or document structure.
- [ ] 3.10 Present Uniwork sessions as tasks in the Uniwork Project Tree with user-visible task lifecycle state and only lightweight agent-run hints.
- [ ] 3.11 Restore the selected task's transcript first when switching tasks, while preserving preview or worktree view state as task context.
- [ ] 3.12 Show the Uniwork Task Review Rail only for selected tasks with reviewable worktree or merge-preview state.
- [ ] 3.13 Keep project status, target navigation, task queue management, and agent-run management out of the Uniwork Task Review Rail.

## 4. Target And Worktree Workflow

- [ ] 4.1 Create Uniwork targets from workspace `.univer` files and agent activity using host-defined display/source identity.
- [ ] 4.2 Implement trunk/worktree/merge-preview scope selection for the active target.
- [ ] 4.3 Render worktree status for `open`, `ready`, `merged`, and `discarded`.
- [ ] 4.4 Map gateway worktree statuses to office draft labels while preserving canonical statuses internally.
- [ ] 4.5 Implement ready-worktree merge flow, mapping user-facing apply draft or accept changes copy to the gateway `merge` operation.
- [ ] 4.6 Implement discard flow with Reasonix approval and gateway `discard` execution.
- [ ] 4.7 Display merge preview divergence and conflict results from Univer tooling using plain-language review and needs-your-decision states.

## 5. Transcript Blocks

- [ ] 5.1 Add serializable Uniwork Block schemas for target, draft status, review request, action result, and capability failure blocks.
- [ ] 5.2 Generate Uniwork Blocks only from host/tooling evidence.
- [ ] 5.3 Restore Uniwork Blocks when reopening Uniwork sessions.
- [ ] 5.4 Render Uniwork Blocks as document milestones and review decision surfaces rather than raw tool logs.
- [ ] 5.5 Define Uniwork Block envelope fields: block id, schema version, kind, timestamp, source, target ref, unit ref, scope ref, status, summary, actions, and diagnostics.
- [ ] 5.6 Implement Uniwork Block kinds for target, draft status, review request, action result, and capability failure.
- [ ] 5.7 Localize and test stable Uniwork state copy for empty target, opening target, ready target, draft progress, ready review, apply, discard, needs decision, failure, and incompatibility states.

## 6. V1 Preview Migration

- [ ] 6.1 Route Workspace `.univer` entries to Uniwork instead of V1 Live Univer Preview.
- [ ] 6.2 Add Code activity handoff entry points into Uniwork for `.univer` artifacts.
- [ ] 6.3 Remove V1 Live Univer Preview provider, iframe surface, preview signal inference, and preview-specific code after Uniwork coverage is in place.
- [ ] 6.4 Replace V1 preview tests with Uniwork activity, target, failure, worktree, merge, and discard tests.

## 7. Verification

- [ ] 7.1 Run frontend typecheck and tests for Uniwork shell, activity switching, target state, and transcript blocks.
- [ ] 7.2 Run Go tests for Uniwork bridge/tooling discovery.
- [ ] 7.3 Smoke test with a gateway-created `.univer`: daemon status, Uniwork target open, trunk render, worktree open, ready, merge, discard, and conflict display.
- [ ] 7.4 Validate the OpenSpec change with strict validation.
