# Reasonix Univer Integration

This context names the concepts used when Reasonix Desktop shows `.univer` content while an agent is changing it through Univer tooling.

## Language

**Cowork Mode**:
A Reasonix Desktop mode optimized for working with Univerfiles while agents and Univer tooling change them. It owns the desktop workflow around Univer work without owning Univer document semantics.
_Avoid_: Univer app, native Univer editor

**Cowork Orchestration**:
Reasonix-owned coordination of Univer-facing process state, user-visible status, workspace focus, and agent activity inside Cowork Mode.
_Avoid_: Univer runtime, document engine

**Univer Semantics**:
The workbook, document, collaboration, SaC, sync, Trunk, and Worktree behavior defined by Univer tooling for Univerfiles.
_Avoid_: Reasonix workbook model, desktop editor rules

**Univer Capability Package**:
A versioned Univer-provided package that exposes a stable contract Cowork Mode can consume, such as types, schemas, status models, or embeddable UI entrypoints.
_Avoid_: source checkout, repository submodule

**Cowork Package**:
The single Univer-owned Capability Package, published from the Univer tooling repository, that exposes Cowork Mode's frontend component set while preserving separate lightweight contract entrypoints.
_Avoid_: package collection, source bundle

**Cowork Surface**:
An embedded Univer-aware work surface exported by the Cowork Package for focused document, spreadsheet, or slide interaction inside Cowork Mode. It is one Cowork Component, not the full Reasonix Cowork shell.
_Avoid_: iframe preview, full desktop shell

**Cowork Component**:
A Univer-aware UI component exported by the Cowork Package for embedding in the Cowork Shell, transcript, sidebar, panel, or focused work area.
_Avoid_: standalone app, host shell component

**Cowork Headless Primitive**:
A non-visual hook, state helper, or behavior primitive exported by the Cowork Package so hosts can build their own Cowork UI while reusing Univer-aware logic.
_Avoid_: fixed UI component, Reasonix-specific widget

**Cowork Shell**:
The Reasonix-owned transcript-first desktop layout around Cowork Components, including mode chrome, workspace focus, agent transcript, process status, commands, and recovery UI.
_Avoid_: Univer work surface, embedded editor

**Workspace Activity**:
A workspace-level Reasonix product mode selected by the user, such as Code or Cowork. It controls which layout new sessions use without being a global appearance setting.
_Avoid_: desktop theme, global layout style

**Code Activity**:
The existing Reasonix coding-agent workspace activity.
_Avoid_: chat mode, default activity

**Cowork Activity**:
The workspace activity that opens the Cowork Shell and makes new sessions default to Cowork Sessions.
_Avoid_: global Cowork setting, Univer app

**Cowork Activity Switch**:
The user-facing workspace control that switches between Code Activity and Cowork Activity.
_Avoid_: automatic mode jump, session type prompt

**Cowork Entry**:
A user-facing route from Code Activity or workspace navigation into Cowork Activity for a Univerfile.
_Avoid_: Code preview, inline spreadsheet viewer

**Cowork Session**:
A Reasonix session whose persisted kind restores the Cowork Shell when opened from recents or tabs.
_Avoid_: normal code session, temporary preview

**Cowork Block**:
A serializable transcript block that records a Cowork target, worktree, preview, command result, or related Univer-aware state for later rendering.
_Avoid_: React component state, ad hoc markdown

**Authoritative Cowork Block**:
A Cowork Block created by the host from real Univer tooling, daemon, target, or worktree state.
_Avoid_: model-authored UI state, speculative block

**Cowork Worktree UX**:
The Cowork UI flow for showing Collab Gateway worktree status, opening trunk or worktree scope, showing merge preview/conflict state, and requesting merge or discard while agents change Univerfiles. It is grounded in `@univer/collab-gateway-contract`, not Git worktree semantics.
_Avoid_: placeholder worktree card, Git worktree

**Worktree Operation**:
A Univer-owned Collab Gateway control-plane action such as `createWorktree`, `commit`, `rollback`, `ready`, `merge`, `discard`, `previewMerge`, or `getMergePreviewUnit`. Cowork UI labels like accept must map to these concrete operations, with accept mapping to `merge`.
_Avoid_: frontend merge, Reasonix document mutation, Git operation

**Gateway Worktree State**:
The Collab Gateway state for a worktree, including `worktreeId`, `status`, `baseline`, `headCommit`, agent metadata, current unit summaries, merge preview, and conflicts.
_Avoid_: Git branch graph, UI-only history, Reasonix-only lifecycle

**Cowork Tooling Protocol**:
The shared executable, daemon, and package-facing protocol that exposes Cowork Protocol Version, gateway endpoint health, unit refs, target scopes, lifecycle events, and Collab Gateway worktree operations to host applications.
_Avoid_: CLI text scraping, iframe URL contract

**Cowork Mount API**:
A lower-level browser entrypoint from the Cowork Package that mounts the Cowork Surface outside a React component tree.
_Avoid_: separate product app, daemon API

**Cowork Host Adapter**:
A host-provided implementation of the Cowork Package orchestration contract. It maps Cowork Surface requests and events to the embedding agent app's workspace, permissions, daemon, bridge, or backend.
_Avoid_: Reasonix bridge, Wails adapter

**Reasonix Cowork Host Adapter**:
The Reasonix Desktop implementation of the Cowork Host Adapter contract, kept inside the Reasonix repository and wired to the Wails bridge and Go orchestration.
_Avoid_: shared Univer package, published adapter

**Univer Tooling Discovery**:
The host-owned process of finding, configuring, and checking the local Univer executable or daemon used for Cowork orchestration.
_Avoid_: bundled runtime, automatic installer

**Univer Tooling Session**:
A workspace-scoped host-managed session or process pool for Univer executable, daemon, gateway, and related Cowork orchestration.
_Avoid_: per-target sidecar, global always-on service

**Cowork Result Block**:
An Authoritative Cowork Block that records a user-relevant outcome such as target opened, Worktree ready, merge completed, discard completed, conflict found, or verification failed.
_Avoid_: daemon log entry, process heartbeat

**Gateway Endpoint**:
The Univer-owned realtime endpoint the Cowork Surface connects to for document rendering and collaboration traffic.
_Avoid_: host bridge, desktop proxy

**Cowork Target**:
The host-provided object that identifies the Univerfile and current Cowork context shown by a Cowork Surface, including host-defined display or source path, display identity, view selection, gateway endpoint, health, and supported host capabilities.
_Avoid_: iframe URL, package-owned file handle

**Cowork View Ref**:
A host or Univer tooling supplied render scope for a Cowork Target, such as trunk, a Collab Gateway worktree, or a merge preview for a selected unit.
_Avoid_: separate viewer, fixed worktree alias, storage ref id

**Cowork View Ref Model**:
The public Cowork contract for selecting renderable target states, aligned with Collab Gateway runtime configuration and worktree scope while hiding gateway URL construction details.
_Avoid_: WorkbookViewReadService API, storage ref internals, raw `/uf` URL persistence

**Cowork Unit Ref**:
A Cowork contract reference to a renderable unit inside a Cowork Target, including its type such as sheet, doc, slide, or base.
_Avoid_: spreadsheet-only target, implicit active unit

**Host-Defined Path**:
A path-like Cowork Target string supplied by the host for display, intent round-trips, or source identity. The Cowork Package does not interpret it or use it for local IO.
_Avoid_: package absolute path, filesystem authority

**Cowork Color Scheme**:
The host-provided light or dark appearance mode consumed by the Cowork Surface.
_Avoid_: full theme token set, Reasonix theme style

**Cowork Intent**:
A typed request emitted by the Cowork Surface for the host to consider, such as changing target, retrying a capability, opening a unit, syncing, or verifying.
_Avoid_: shell command string, direct mutation, host state update

**Cowork Approval**:
A Reasonix permission or approval prompt presented in Cowork terms for a Cowork Intent.
_Avoid_: raw command approval, separate approval system

**Cowork Capability**:
A host-reported ability available to the Cowork Surface for a target or host environment.
_Avoid_: frontend probe, implicit CLI support

**Cowork Protocol Version**:
The explicit compatibility version used by the Cowork Package, host adapter, and Univer executable or daemon contracts.
_Avoid_: package version, best-effort parsing

**Cowork Incompatibility**:
A typed failure that reports unsupported or mismatched Cowork Protocol Version, intent catalog, or capability contract between the Cowork Package, host, and Univer tooling.
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
The V1 Reasonix Desktop surface where a user watches a Univerfile update after the agent changes it through Univer tooling. Cowork supersedes it as the primary Univerfile workbench.
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
