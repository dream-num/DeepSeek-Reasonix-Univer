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

#### Scenario: Cowork target is opened

- **WHEN** Reasonix opens a Cowork target from user action or agent activity
- **THEN** it may create an Authoritative Cowork Block that records the target and current scope
- **AND** the block is serializable for session restoration

#### Scenario: Worktree action completes

- **WHEN** a merge, discard, target open, or capability check completes
- **THEN** Reasonix Desktop may append a Cowork Result Block based on the real operation result
- **AND** the block is not authored as arbitrary JSON by the model

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
