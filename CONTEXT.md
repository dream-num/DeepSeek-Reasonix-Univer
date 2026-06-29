# Reasonix Univer Integration

This context names the concepts used when Reasonix Desktop shows `.univer` content while an agent is changing it through Univer tooling.

## Language

**Uniwork Mode**:
A Reasonix Desktop mode optimized for working with Univerfiles while agents and Univer tooling change them. It owns the desktop workflow around Univer work without owning Univer document semantics.
_Avoid_: Univer app, native Univer editor

**Uniwork Orchestration**:
Reasonix-owned coordination of Univer-facing process state, user-visible status, workspace focus, and agent activity inside Uniwork Mode.
_Avoid_: Univer runtime, document engine

**Univer Semantics**:
The workbook, document, collaboration, SaC, sync, Trunk, and Worktree behavior defined by Univer tooling for Univerfiles.
_Avoid_: Reasonix workbook model, desktop editor rules

**Univer Capability Package**:
A versioned Univer-provided package that exposes a stable contract Uniwork Mode can consume, such as types, schemas, status models, or embeddable UI entrypoints.
_Avoid_: source checkout, repository submodule

**Uniwork Package**:
The single Univer-owned Capability Package, published from the Univer tooling repository, that exposes Uniwork Mode's frontend component set while preserving separate lightweight contract entrypoints.
_Avoid_: package collection, source bundle

**Uniwork Surface**:
An embedded Univer-aware work surface exported by the Uniwork Package for focused document, spreadsheet, or slide interaction inside Uniwork Mode. It is one Uniwork Component, not the full Reasonix Uniwork shell.
_Avoid_: iframe preview, full desktop shell

**Uniwork Component**:
A Univer-aware UI component exported by the Uniwork Package for embedding in the Uniwork Shell, transcript, sidebar, panel, or focused work area.
_Avoid_: standalone app, host shell component

**Uniwork Headless Primitive**:
A non-visual hook, state helper, or behavior primitive exported by the Uniwork Package so hosts can build their own Uniwork UI while reusing Univer-aware logic.
_Avoid_: fixed UI component, Reasonix-specific widget

**Uniwork Shell**:
The Reasonix-owned transcript-first desktop layout around Uniwork Components, including mode chrome, workspace focus, agent transcript, process status, commands, and recovery UI. Switching tasks restores the selected task's transcript first; preview and worktree views are task context, not the primary task switch target.
_Avoid_: Univer work surface, embedded editor

**Workspace Activity**:
A workspace-level Reasonix product mode selected by the user, such as Code or Uniwork. It controls which layout new sessions use without being a global appearance setting.
_Avoid_: desktop theme, global layout style

**Code Activity**:
The existing Reasonix coding-agent workspace activity.
_Avoid_: chat mode, default activity

**Uniwork Activity**:
The workspace activity that opens the Uniwork Shell and makes new sessions default to Uniwork Sessions.
_Avoid_: global Uniwork setting, Univer app

**Uniwork Activity Switch**:
The user-facing workspace control that switches between Code Activity and Uniwork Activity.
_Avoid_: automatic mode jump, session type prompt

**Uniwork Entry**:
A user-facing route from Code Activity or workspace navigation into Uniwork Activity for a Univerfile.
_Avoid_: Code preview, inline spreadsheet viewer

**Uniwork Session**:
A Reasonix session whose persisted kind restores the Uniwork Shell when opened from recents or tabs. In the Uniwork project tree, a Uniwork Session is presented to users as a Uniwork Task.
_Avoid_: normal code session, temporary preview

**Uniwork Task**:
A user-visible work item in Uniwork Mode. It owns the task intent, transcript, optional target/worktree context, review state, and user-facing lifecycle; a task can start without a target but needs one before entering worktree review.
_Avoid_: agent run, queue item, chat message

**Uniwork Task Lifecycle**:
The user-visible state model for a Uniwork Task, such as running, needs review, conflicted, merged, discarded, or failed. It may be derived from Gateway Worktree State but does not expose raw gateway lifecycle names directly.
_Avoid_: gateway status, agent process state, session state

**Uniwork Agent Run**:
A concrete execution attempt under a Uniwork Task. A task may have one primary run plus retries, branches, or helper runs without changing the user's visible task identity.
_Avoid_: task, session, worktree

**Uniwork Project Tree**:
The Uniwork Shell navigation surface where Uniwork Sessions are presented as user-visible tasks alongside project grouping and target context.
_Avoid_: agent queue, file browser only, session debug list

**Uniwork Task Queue**:
The task list shown inside the Uniwork Project Tree. It presents Uniwork Task lifecycle state first, with Agent Run details only as lightweight hints or drill-down context.
_Avoid_: agent process list, run queue, transcript history

**Uniwork Project Bar**:
The immersive Uniwork Shell bar for project-level and target-level orientation, such as current project, current target, target navigation, and low-key gateway or sync health.
_Avoid_: task review rail, merge toolbar, agent detail panel

**Uniwork Target Navigator**:
A compact project-bar control that opens a popover for browsing the current Uniwork Target's files, units, or relevant document structure.
_Avoid_: always-visible file tree, task queue, full sidebar

**Uniwork Task Review Rail**:
The right-side Uniwork Shell panel for the selected task's review state, including changed units, preview mode, readiness, conflicts, merge, and discard. It appears only when the selected task has reviewable worktree or preview state; changed units act as review summaries and quick jumps, not as a full target navigator.
_Avoid_: project status panel, agent queue, file navigator

**Uniwork Block**:
A serializable transcript block that records task-relevant Uniwork events such as target selection, worktree creation, preview readiness, command result, approval, merge, discard, conflict, or verification failure.
_Avoid_: React component state, project status log, ad hoc markdown

**Authoritative Uniwork Block**:
A Uniwork Block created by the host from real Univer tooling, daemon, target, or worktree state.
_Avoid_: model-authored UI state, speculative block

**Uniwork Worktree UX**:
The Uniwork UI flow for showing Collab Gateway worktree status, opening trunk or worktree scope, showing merge preview/conflict state, and requesting merge or discard while agents change Univerfiles. It is grounded in `@univer/collab-gateway-contract`, not Git worktree semantics.
_Avoid_: placeholder worktree card, Git worktree

**Worktree Operation**:
A Univer-owned Collab Gateway control-plane action such as `createWorktree`, `commit`, `rollback`, `ready`, `merge`, `discard`, `previewMerge`, or `getMergePreviewUnit`. Uniwork UI labels like accept must map to these concrete operations, with accept mapping to `merge`.
_Avoid_: frontend merge, Reasonix document mutation, Git operation

**Gateway Worktree State**:
The Collab Gateway state for a worktree, including `worktreeId`, `status`, `baseline`, `headCommit`, agent metadata, current unit summaries, merge preview, and conflicts.
_Avoid_: Git branch graph, UI-only history, Reasonix-only lifecycle

**Uniwork Tooling Protocol**:
The shared executable, daemon, and package-facing protocol that exposes Uniwork Protocol Version, gateway endpoint health, unit refs, target scopes, lifecycle events, and Collab Gateway worktree operations to host applications.
_Avoid_: CLI text scraping, iframe URL contract

**Uniwork Mount API**:
A lower-level browser entrypoint from the Uniwork Package that mounts the Uniwork Surface outside a React component tree.
_Avoid_: separate product app, daemon API

**Uniwork Host Adapter**:
A host-provided implementation of the Uniwork Package orchestration contract. It maps Uniwork Surface requests and events to the embedding agent app's workspace, permissions, daemon, bridge, or backend.
_Avoid_: Reasonix bridge, Wails adapter

**Reasonix Uniwork Host Adapter**:
The Reasonix Desktop implementation of the Uniwork Host Adapter contract, kept inside the Reasonix repository and wired to the Wails bridge and Go orchestration.
_Avoid_: shared Univer package, published adapter

**Univer Tooling Discovery**:
The host-owned process of finding, configuring, and checking the local Univer executable or daemon used for Uniwork orchestration.
_Avoid_: bundled runtime, automatic installer

**Univer Tooling Session**:
A workspace-scoped host-managed session or process pool for Univer executable, daemon, gateway, and related Uniwork orchestration.
_Avoid_: per-target sidecar, global always-on service

**Uniwork Result Block**:
An Authoritative Uniwork Block that records a user-relevant outcome such as target opened, Worktree ready, merge completed, discard completed, conflict found, or verification failed.
_Avoid_: daemon log entry, process heartbeat

**Gateway Endpoint**:
The Univer-owned realtime endpoint the Uniwork Surface connects to for document rendering and collaboration traffic.
_Avoid_: host bridge, desktop proxy

**Uniwork Target**:
The host-provided object that identifies the Univerfile and current Uniwork context shown by a Uniwork Surface, including host-defined display or source path, display identity, view selection, gateway endpoint, health, and supported host capabilities.
_Avoid_: iframe URL, package-owned file handle

**Uniwork Active Target**:
The target shown by the Uniwork Project Bar for the current user context. It is project-wide by default, inherited by new tasks, overridden by the selected task's bound target when a task is active, and represented by a select-target affordance when no target is available.
_Avoid_: global file, preview target, selected unit

**Uniwork View Ref**:
A host or Univer tooling supplied render scope for a Uniwork Target, such as trunk, a Collab Gateway worktree, or a merge preview for a selected unit.
_Avoid_: separate viewer, fixed worktree alias, storage ref id

**Uniwork View Ref Model**:
The public Uniwork contract for selecting renderable target states, aligned with Collab Gateway runtime configuration and worktree scope while hiding gateway URL construction details.
_Avoid_: WorkbookViewReadService API, storage ref internals, raw `/uf` URL persistence

**Uniwork Unit Ref**:
A Uniwork contract reference to a renderable unit inside a Uniwork Target, including its type such as sheet, doc, slide, or base.
_Avoid_: spreadsheet-only target, implicit active unit

**Host-Defined Path**:
A path-like Uniwork Target string supplied by the host for display, intent round-trips, or source identity. The Uniwork Package does not interpret it or use it for local IO.
_Avoid_: package absolute path, filesystem authority

**Uniwork Color Scheme**:
The host-provided light or dark appearance mode consumed by the Uniwork Surface.
_Avoid_: full theme token set, Reasonix theme style

**Uniwork Intent**:
A typed request emitted by the Uniwork Surface for the host to consider, such as changing target, retrying a capability, opening a unit, syncing, or verifying.
_Avoid_: shell command string, direct mutation, host state update

**Uniwork Approval**:
A Reasonix permission or approval prompt presented in Uniwork terms for a Uniwork Intent.
_Avoid_: raw command approval, separate approval system

**Uniwork Capability**:
A host-reported ability available to the Uniwork Surface for a target or host environment.
_Avoid_: frontend probe, implicit CLI support

**Uniwork Protocol Version**:
The explicit compatibility version used by the Uniwork Package, host adapter, and Univer executable or daemon contracts.
_Avoid_: package version, best-effort parsing

**Uniwork Incompatibility**:
A typed failure that reports unsupported or mismatched Uniwork Protocol Version, intent catalog, or capability contract between the Uniwork Package, host, and Univer tooling.
_Avoid_: generic error, silent fallback

**Univerfile**:
A `.univer` file that stores the document or workbook state Reasonix should inspect and display.
_Avoid_: workbook file, spreadsheet file

**Collab Gateway**:
The local authority for addressed Univerfiles; it exposes live content, lifecycle events, and worktree decisions to clients.
_Avoid_: viewer server, preview server

**Gateway Sidecar**:
A local child process managed or discovered by Reasonix Desktop that runs the Collab Gateway for Live Univer Preview.
_Avoid_: embedded gateway, built-in viewer

**Managed Sidecar**:
A Gateway Sidecar that Reasonix Desktop started on demand and is responsible for shutting down.
_Avoid_: always-on service, user-started server

**Univer Preview Capability**:
The observable local ability to serve a Univerfile through the Collab Gateway and Collab Client. Reasonix treats the Univer CLI's internal write path as opaque.
_Avoid_: CLI implementation detail, legacy write mode

**Collab Client**:
The browser-side Univer experience that connects to the Collab Gateway and renders trunk or worktree content.
_Avoid_: React component, embedded spreadsheet

**Client-Passthrough Interaction**:
Reasonix Desktop embeds the Collab Client as provided by Univer tooling and does not redefine its editing, merge, discard, or other in-client behavior.
_Avoid_: Reasonix-owned editor behavior, desktop editing mode

**Live Univer Preview**:
The V1 Reasonix Desktop surface where a user watches a Univerfile update after the agent changes it through Univer tooling. Uniwork supersedes it as the primary Univerfile workbench.
_Avoid_: file preview, static preview

**Preview Target**:
The single Univerfile currently shown in Live Univer Preview, chosen explicitly by the user or inferred from the latest agent activity that names a Univerfile.
_Avoid_: discovered file, watched workbook

**Explicit Preview Target**:
A Preview Target chosen by the user from the Workspace panel. It takes precedence over agent activity until the user changes or clears it.
_Avoid_: auto-selected file

**Agent Preview Signal**:
An unambiguous `.univer` path found in agent tool arguments, tool output, or workspace changes that may update the Preview Target when no Explicit Preview Target is active.
_Avoid_: directory scan, guessed target

**Workspace Preview Entry**:
The Workspace panel path that opens Live Univer Preview for a Preview Target.
_Avoid_: top-level Univer app, separate navigation

**Preview URL**:
The URL produced by the Univer Preview Capability for a Preview Target and embedded by Reasonix Desktop.
_Avoid_: local route, bundled viewer

**Preview Path Exposure**:
The local-only disclosure of a Preview Target path inside the Preview URL used by the embedded Collab Client.
_Avoid_: telemetry field, remote URL

**Preview Command**:
The stable command-line contract Reasonix Desktop calls to obtain a Preview URL for a Preview Target.
_Avoid_: stdout scraping, URL construction

**Preview Failure**:
An unavailable or failed Univer Preview Capability shown inside the Workspace preview surface without changing the agent conversation.
_Avoid_: agent error, automatic installer

**Trunk**:
The accepted current state of a Univerfile.
_Avoid_: main branch, base file

**Worktree**:
The Collab Gateway worktree for a Univerfile: an isolated, Univer-owned work scope created from trunk with a recorded baseline, commit sequence, lifecycle status, and eventual merge or discard decision.
_Avoid_: branch, draft copy, Git worktree
