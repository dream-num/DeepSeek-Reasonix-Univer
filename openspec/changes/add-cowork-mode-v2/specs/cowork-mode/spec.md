## ADDED Requirements

### Requirement: Switch between Code and Cowork activities

Reasonix Desktop SHALL provide Cowork as a workspace activity alongside Code.

#### Scenario: User switches to Cowork

- **WHEN** the user selects the Cowork activity
- **THEN** Reasonix Desktop displays the Cowork shell
- **AND** new sessions created from that activity are Cowork sessions

#### Scenario: User switches back to Code

- **WHEN** the user selects the Code activity
- **THEN** Reasonix Desktop displays the existing Code shell
- **AND** new sessions created from that activity are Code sessions

#### Scenario: Cowork session is reopened

- **WHEN** the user opens a persisted Cowork session from recents or tabs
- **THEN** Reasonix Desktop restores the Cowork shell for that session

### Requirement: Host Cowork shell around Univer components

Reasonix Desktop SHALL own the Cowork shell layout and embed Univer Cowork components inside it.

#### Scenario: Cowork shell is shown

- **WHEN** a Cowork session is active
- **THEN** Reasonix Desktop displays a transcript-first Cowork shell
- **AND** it provides regions for transcript blocks, target status, and focused Univer work surfaces

#### Scenario: Univer component is embedded

- **WHEN** a Cowork target is available
- **THEN** Reasonix Desktop renders the Univer-provided Cowork component for the active target
- **AND** it keeps session navigation, transcript, approvals, and shell chrome under Reasonix ownership

### Requirement: Provide a document-oriented Cowork first screen

Reasonix Desktop SHALL make the Cowork first screen feel like a document collaboration workspace rather than an empty code chat.

#### Scenario: Cowork opens without an active target

- **WHEN** the user opens Cowork with no active `.univer` target
- **THEN** Reasonix Desktop shows a Cowork shell with session/document navigation, a transcript empty state, and a focused document-workspace placeholder
- **AND** the primary entry actions include opening a `.univer` file, continuing a recent Cowork session, or reviewing a ready draft when available

#### Scenario: Cowork opens with recent ready drafts

- **WHEN** Reasonix has persisted Cowork sessions or targets with ready-for-review drafts
- **THEN** the Cowork first screen makes those drafts scannable from the Cowork navigation or transcript
- **AND** each ready draft exposes a review action without requiring the user to browse the raw workspace file tree first

#### Scenario: Cowork opens with an active target

- **WHEN** a Cowork target is already active for the session
- **THEN** Reasonix Desktop shows the latest Cowork Block milestone in the transcript
- **AND** it shows the selected Univer unit or review surface in the focused work area

### Requirement: Present Cowork as office-native document collaboration

Reasonix Desktop SHALL present Cowork Mode with user-facing language and hierarchy suitable for office workers collaborating on documents, spreadsheets, and slides.

#### Scenario: Cowork shell is rendered for an office workflow

- **WHEN** a Cowork session is active
- **THEN** the primary UI uses document collaboration concepts such as document, spreadsheet, slide, draft, review, apply, keep editing, and discard
- **AND** it does not require the user to understand CLI, daemon, gateway, worktree, merge, protocol, JSON, or log terminology in the primary path

#### Scenario: Technical details are useful for diagnostics

- **WHEN** a Cowork capability failure or incompatibility state includes technical details
- **THEN** Reasonix Desktop displays a plain-language summary first
- **AND** it keeps technical details secondary or expandable

### Requirement: Use stable Cowork state copy

Reasonix Desktop SHALL use stable office-language labels for common Cowork states and actions.

#### Scenario: No target is selected

- **WHEN** Cowork has no active target
- **THEN** the primary empty-state copy communicates that the user can open a document, spreadsheet, or slide deck to start Cowork

#### Scenario: Target is opening

- **WHEN** Reasonix is creating or restoring a Cowork target
- **THEN** the visible status copy says the document is opening
- **AND** it does not describe daemon startup or gateway discovery as the primary message

#### Scenario: Target is ready

- **WHEN** Univer tooling reports that a target is ready to render
- **THEN** the visible status copy says the document is ready to work on

#### Scenario: Draft action labels are shown

- **WHEN** Cowork renders draft review actions
- **THEN** the primary action labels use office-language copy such as review changes, apply draft, keep editing, and discard draft
- **AND** protocol operation names remain internal or secondary diagnostics

### Requirement: Map gateway worktree state to office draft language

Reasonix Desktop SHALL preserve gateway worktree semantics internally while translating them to office-friendly user-facing labels.

#### Scenario: Worktree status is shown to the user

- **WHEN** Cowork UI renders a gateway worktree status
- **THEN** it may show user-facing draft labels such as in progress, ready for review, applied, or discarded
- **AND** it preserves the canonical `open`, `ready`, `merged`, or `discarded` status in the target or adapter state

#### Scenario: Merge action is offered

- **WHEN** a ready worktree can be merged
- **THEN** the primary action copy MAY say apply draft or accept changes
- **AND** the executed operation remains the gateway `merge` operation

#### Scenario: Conflict requires user attention

- **WHEN** Univer tooling reports a merge conflict
- **THEN** the primary Cowork UI explains that the draft needs the user's decision
- **AND** diagnostic details MAY identify the failed unit or conflict source without making protocol terminology the headline

### Requirement: Use Univer-owned Cowork package

Reasonix Desktop SHALL consume a Univer-published Cowork package for Univer-aware frontend components and contracts.

#### Scenario: Cowork package is available

- **WHEN** the desktop frontend builds Cowork Mode
- **THEN** it imports Cowork components, headless primitives, or types from the Univer Cowork package
- **AND** it does not import a `univer-cli` source checkout or git submodule

#### Scenario: Cowork package reports incompatibility

- **WHEN** the Cowork package, host adapter, or Univer tooling reports an unsupported Cowork Protocol Version
- **THEN** Reasonix Desktop displays a typed Cowork incompatibility state
- **AND** it does not silently fall back to V1 Live Univer Preview

### Requirement: Implement Reasonix Cowork host adapter

Reasonix Desktop SHALL implement a host adapter that maps Cowork package requests to Reasonix workspace, bridge, approval, and Univer tooling behavior.

#### Scenario: Cowork component emits an intent

- **WHEN** a Cowork component emits a typed intent
- **THEN** the Reasonix Cowork host adapter receives the intent
- **AND** Reasonix decides whether to approve, reject, execute, or log the requested action

#### Scenario: Host-owned process action is required

- **WHEN** a Cowork action requires local Univer executable or daemon orchestration
- **THEN** the Reasonix host adapter invokes the Go bridge
- **AND** the Go bridge discovers or calls the local `univer` executable instead of letting frontend code run shell commands

### Requirement: Establish a workspace-scoped Univer tooling session

Reasonix Desktop SHALL manage Univer tooling availability as workspace-scoped Cowork orchestration state.

#### Scenario: Cowork target requires gateway access

- **WHEN** Reasonix opens a Cowork target that requires Univer gateway access
- **THEN** Reasonix Desktop starts or discovers the Univer daemon through the host bridge
- **AND** it records gateway endpoint, health, capabilities, and protocol version for the workspace session

#### Scenario: Tooling is unavailable

- **WHEN** the local Univer executable is missing, daemon startup fails, or gateway status is invalid
- **THEN** Reasonix Desktop displays a Cowork capability failure in the Cowork shell
- **AND** it does not append the failure as an ordinary model message

### Requirement: Pass Cowork targets instead of paths alone

Reasonix Desktop SHALL pass a Cowork Target object to Univer Cowork components instead of only passing a `.univer` path.

#### Scenario: Target is created for a Univerfile

- **WHEN** Reasonix creates a Cowork target for a `.univer` file
- **THEN** the target includes host display identity, source identity, gateway endpoint state, active scope, active unit reference, and supported capabilities
- **AND** the Cowork package does not discover the target path or workspace state on its own

#### Scenario: Target path is displayed

- **WHEN** Cowork UI displays target identity
- **THEN** Reasonix Desktop uses host-defined display strings
- **AND** persisted transcript state does not require storing a raw gateway URL as target identity

### Requirement: Align worktree state with Collab Gateway contract

Reasonix Desktop SHALL represent Cowork worktree state using the Univer Collab Gateway contract semantics.

#### Scenario: Worktree list is shown

- **WHEN** Cowork UI displays worktree status
- **THEN** it uses the gateway worktree statuses `open`, `ready`, `merged`, and `discarded`
- **AND** it does not introduce Reasonix-only lifecycle states for the same gateway worktree

#### Scenario: Worktree status updates

- **WHEN** Univer tooling reports a worktree lifecycle event
- **THEN** Reasonix Desktop updates Cowork target or block state from that event
- **AND** it treats Univer tooling as the authority for the worktree status

### Requirement: Organize Cowork around sessions, documents, drafts, and review decisions

Reasonix Desktop SHALL organize the Cowork shell information architecture around office collaboration objects rather than raw workspace file preview.

#### Scenario: Cowork sidebar is shown

- **WHEN** Cowork activity is active
- **THEN** Reasonix Desktop prioritizes recent Cowork sessions, document targets, and draft/review status where available
- **AND** it still allows the user to navigate to workspace files when needed

#### Scenario: A draft is ready for review

- **WHEN** Univer tooling reports a ready worktree or merge preview for a Cowork target
- **THEN** Reasonix Desktop provides a review surface that summarizes what changed, what needs attention, and the available next actions
- **AND** it offers safe actions such as apply draft, keep editing, or discard draft according to reported capabilities

### Requirement: Apply Cowork visual hierarchy consistently

Reasonix Desktop SHALL prioritize Cowork UI information by office decision value before implementation detail.

#### Scenario: Cowork milestone is rendered in the transcript

- **WHEN** a Cowork Block is shown in the transcript
- **THEN** its default view prioritizes target title, user-facing status, one-sentence summary, and available next action
- **AND** secondary fields such as unit id, scope, revision, protocol status, gateway origin, and diagnostics are hidden or visually subordinate

#### Scenario: Cowork review surface is rendered

- **WHEN** a draft is ready for review
- **THEN** the review surface prioritizes what changed, what needs attention, and the next safe action
- **AND** detailed protocol or revision data does not displace the review summary

#### Scenario: Technical details are expanded

- **WHEN** the user expands technical details for support or debugging
- **THEN** Reasonix Desktop may show canonical status, unit id, scope, revision, protocol version, failure code, or gateway detail
- **AND** the primary Cowork copy remains plain-language and office-oriented

### Requirement: Open trunk and worktree views through Cowork target scope

Reasonix Desktop SHALL open trunk, worktree, and merge preview views by updating Cowork target scope.

#### Scenario: User opens a worktree

- **WHEN** the user opens a Cowork worktree
- **THEN** Reasonix Desktop selects the matching worktree scope on the active Cowork target
- **AND** the Univer Cowork component renders the selected unit through Univer gateway runtime configuration

#### Scenario: User returns to trunk

- **WHEN** the user exits a worktree or a terminal worktree state is reported
- **THEN** Reasonix Desktop selects trunk scope for the active Cowork target

### Requirement: Request merge and discard through Univer tooling

Reasonix Desktop SHALL execute worktree merge and discard through Univer tooling authority.

#### Scenario: User accepts a ready worktree

- **WHEN** the user confirms an accept action for a ready worktree
- **THEN** Reasonix Desktop maps the action to the gateway `merge` operation
- **AND** it records success from the `mergedRevs` response when merge succeeds

#### Scenario: Merge reports conflict

- **WHEN** Univer tooling returns `ok:false` with `conflict:true`
- **THEN** Reasonix Desktop displays a conflict state for the failed unit
- **AND** it keeps the worktree available for further user or agent action

#### Scenario: User discards a worktree

- **WHEN** the user confirms a discard action for a non-terminal worktree
- **THEN** Reasonix Desktop maps the action to the gateway `discard` operation
- **AND** it records that trunk is not changed by the discard

### Requirement: Use merge preview without requiring structured diff

Reasonix Desktop SHALL support merge preview data exposed by Univer tooling without requiring a structured diff model in V2.

#### Scenario: Worktree has diverged from trunk

- **WHEN** Univer tooling reports a merge preview with `diverged:true`
- **THEN** Cowork UI can offer a merge preview versus original modification view
- **AND** it uses Univer-provided preview data for rendering

#### Scenario: Structured diff is unavailable

- **WHEN** Univer tooling does not expose a structured worktree diff
- **THEN** Reasonix Desktop still supports status, open, merge, discard, and conflict workflows

### Requirement: Persist host-generated Cowork Blocks

Reasonix Desktop SHALL persist Cowork Blocks that are generated from host or Univer tooling evidence.

#### Scenario: Cowork block is serialized

- **WHEN** Reasonix persists a Cowork Block
- **THEN** the block includes a host-generated block id, schema version, kind, timestamp, source, target reference, optional unit reference, optional scope reference, status, summary, available actions, and optional diagnostics
- **AND** persisted diagnostics do not replace the user-facing summary

#### Scenario: Cowork block target reference is serialized

- **WHEN** a Cowork Block references a document target
- **THEN** the target reference includes host target id, display name, redacted display path, and source identity
- **AND** it does not require storing a raw gateway URL as the user-facing identity

#### Scenario: Cowork block actions are serialized

- **WHEN** a Cowork Block exposes actions
- **THEN** each action has a stable typed action id, user-facing label, availability state, and required approval level
- **AND** action execution still flows through the Reasonix Cowork host adapter

#### Scenario: Cowork target is opened

- **WHEN** Reasonix opens a Cowork target from user action or agent activity
- **THEN** it may create an Authoritative Cowork Block that records the target and current scope
- **AND** the block is serializable for session restoration

#### Scenario: Worktree action completes

- **WHEN** a merge, discard, target open, or capability check completes
- **THEN** Reasonix Desktop may append a Cowork Result Block based on the real operation result
- **AND** the block is not authored as arbitrary JSON by the model

#### Scenario: Cowork block represents a document milestone

- **WHEN** a Cowork target opens, a draft becomes ready for review, changes are applied, or a draft is discarded
- **THEN** Reasonix Desktop may render the Cowork Block as an office milestone in the transcript
- **AND** the block provides concise document identity, status, and next action copy without raw tool-log presentation

#### Scenario: Cowork block kind is target

- **WHEN** Reasonix creates a target Cowork Block
- **THEN** the block confirms the active document, spreadsheet, or slide deck and its current unit where available
- **AND** it offers open or focus actions according to active capabilities

#### Scenario: Cowork block kind is draftStatus

- **WHEN** Reasonix creates a draft status Cowork Block
- **THEN** the block includes the canonical worktree status, user-facing draft status, worktree id, and available review actions where relevant
- **AND** it preserves canonical gateway status for restoration and adapter execution

#### Scenario: Cowork block kind is reviewRequest

- **WHEN** Reasonix creates a review request Cowork Block
- **THEN** the block summarizes what changed, what needs attention, and the next safe actions
- **AND** it may link to a merge preview scope when Univer tooling reports one

#### Scenario: Cowork block kind is actionResult

- **WHEN** a merge, discard, target open, or capability check completes
- **THEN** the block records the user-facing outcome and the canonical operation result needed for restoration
- **AND** it does not present raw operation payload as the main transcript content

#### Scenario: Cowork block kind is capabilityFailure

- **WHEN** Cowork cannot open, render, or operate on a target
- **THEN** the block displays a plain-language failure title, suggested recovery action where available, and optional diagnostics
- **AND** it is visually distinct from ordinary assistant text

### Requirement: Route Univerfile work to Cowork

Reasonix Desktop SHALL route `.univer` document, spreadsheet, and slide work to Cowork as the primary workflow.

#### Scenario: User opens a Univerfile from the workspace

- **WHEN** the user opens a Workspace file whose path ends with `.univer`
- **THEN** Reasonix Desktop opens or offers the Cowork activity for that target
- **AND** it does not open the V1 Live Univer Preview iframe as the primary surface

#### Scenario: Code activity references a Univerfile

- **WHEN** Code activity detects or displays a `.univer` artifact
- **THEN** Reasonix Desktop provides a route into Cowork for that target
- **AND** it does not embed an inline Collab Client iframe inside Code as the recommended path

### Requirement: Remove V1 Live Univer Preview after Cowork completion

Reasonix Desktop SHALL remove the V1 Live Univer Preview implementation once Cowork Mode satisfies the `.univer` workflow.

#### Scenario: Cowork Mode is complete

- **WHEN** Cowork Mode supports target open, gateway availability errors, Univer rendering, worktree status, merge, and discard
- **THEN** Reasonix Desktop removes the V1 preview provider, iframe surface, preview signal behavior, and preview-specific tests
- **AND** equivalent Cowork entry and failure tests replace them
