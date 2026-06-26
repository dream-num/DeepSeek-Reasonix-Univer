## ADDED Requirements

### Requirement: Open Live Univer Preview from Workspace selection

Reasonix Desktop SHALL open Live Univer Preview when the user selects a `.univer` file from the Workspace panel.

#### Scenario: User selects a Univerfile

- **WHEN** the user selects a Workspace file whose path ends with `.univer`
- **THEN** Reasonix Desktop requests a Preview URL for that Univerfile
- **AND** the Workspace preview area displays the returned Collab Client surface

#### Scenario: User selects a non-Univer file

- **WHEN** the user selects a Workspace file whose path does not end with `.univer`
- **THEN** Reasonix Desktop uses the existing Workspace preview behavior for that file

### Requirement: Obtain preview through Univer daemon

Reasonix Desktop SHALL obtain Live Univer Preview through the Univer CLI daemon JSON contract and embed the daemon-served Collab Client URL for an absolute `.univer` path.

#### Scenario: Univer daemon is running

- **WHEN** Reasonix Desktop requests Live Univer Preview for a valid `.univer` path
- **AND** `univer daemon status --json` returns a running `collabGateway.viewUrl`
- **THEN** Reasonix Desktop embeds the Collab Client URL with the `.univer` path in its `file` query parameter
- **AND** it does not construct gateway `/uf` URLs itself

#### Scenario: Univer daemon is stopped

- **WHEN** Reasonix Desktop requests Live Univer Preview
- **AND** `univer daemon status --json` does not return a running Collab Gateway
- **THEN** Reasonix Desktop invokes `univer daemon start`
- **AND** it re-reads `univer daemon status --json` before embedding the Collab Client URL
- **AND** it treats the user-level daemon as discovered, not as a Managed Sidecar to kill on Reasonix shutdown

#### Scenario: Preview provider is unavailable

- **WHEN** the daemon command is missing, exits non-zero, emits invalid JSON, or lacks `collabGateway.viewUrl`
- **THEN** Reasonix Desktop displays a Preview Failure in the Workspace preview surface
- **AND** it does not append the failure to the chat transcript

#### Scenario: Override Preview Command is configured

- **WHEN** `REASONIX_UNIVER_PREVIEW_COMMAND` is set
- **THEN** Reasonix Desktop uses that command instead of the daemon default
- **AND** it expects a JSON result containing `url` or `previewUrl`

### Requirement: Manage preview sidecar on demand

Reasonix Desktop SHALL start or discover the local preview sidecar only when Live Univer Preview is requested.

#### Scenario: First preview request

- **WHEN** no preview sidecar is available and the user requests Live Univer Preview
- **THEN** Reasonix Desktop starts or discovers the sidecar through the preview provider
- **AND** it records whether the sidecar is a Managed Sidecar

#### Scenario: Later preview request

- **WHEN** a preview sidecar is already available in the desktop process
- **THEN** Reasonix Desktop reuses it for the new Preview Target

#### Scenario: Desktop shutdown

- **WHEN** Reasonix Desktop exits
- **THEN** it shuts down Managed Sidecars it started
- **AND** it does not shut down sidecars it only discovered

### Requirement: Preserve Collab Client ownership of interactions

Reasonix Desktop SHALL embed the Collab Client as a passthrough interaction surface.

#### Scenario: Collab Client exposes controls

- **WHEN** the embedded Collab Client displays editing, merge, discard, or worktree controls
- **THEN** Reasonix Desktop leaves those interactions to the Collab Client
- **AND** it does not redefine their behavior in Reasonix UI

### Requirement: Select Preview Target explicitly first

Reasonix Desktop SHALL prioritize Explicit Preview Targets over inferred Agent Preview Signals.

#### Scenario: Explicit target is active

- **WHEN** the user has selected a `.univer` Preview Target
- **AND** later agent activity names a different `.univer` path
- **THEN** Reasonix Desktop keeps showing the Explicit Preview Target

#### Scenario: No explicit target is active

- **WHEN** no Explicit Preview Target is active
- **AND** agent tool arguments, tool output, or workspace changes contain an unambiguous `.univer` path
- **THEN** Reasonix Desktop may request Live Univer Preview for that path

#### Scenario: Ambiguous agent activity

- **WHEN** agent activity contains no `.univer` path or contains ambiguous possible targets
- **THEN** Reasonix Desktop does not infer a Preview Target

### Requirement: Keep preview failures local to the preview surface

Reasonix Desktop SHALL show preview capability failures inside the Workspace preview area with a retry path.

#### Scenario: Preview URL fails to load

- **WHEN** the embedded Preview URL fails to load
- **THEN** the Workspace preview area shows a failure state with retry
- **AND** the chat transcript remains unchanged

#### Scenario: User retries preview

- **WHEN** the user activates retry from a Preview Failure
- **THEN** Reasonix Desktop invokes the preview provider again for the current Preview Target

### Requirement: Limit Preview URL path exposure

Reasonix Desktop SHALL treat Preview URLs and embedded `.univer` paths as local-only preview state.

#### Scenario: Telemetry is emitted

- **WHEN** desktop telemetry or diagnostics are emitted while Live Univer Preview is active
- **THEN** Reasonix Desktop does not include the full Preview URL
- **AND** it does not include the full `.univer` path from the Preview Target

#### Scenario: Preview is displayed

- **WHEN** Reasonix Desktop embeds the Preview URL
- **THEN** the Preview URL may include the local `.univer` path if provided by Univer tooling
