## Why

Reasonix agents can use Univer tooling and skills to change `.univer` files, but Reasonix Desktop currently cannot show the resulting workbook or document state in place. Univer's Collab Gateway and Collab Client provide the live preview capability; Reasonix should integrate that capability without taking ownership of Univer's internal collaboration protocol or client behavior.

## What Changes

- Add Live Univer Preview to the existing Workspace panel for `.univer` files.
- Introduce a desktop-side Univer daemon preview provider that reads `collabGateway.viewUrl` from `univer daemon status --json`, starts the daemon on demand, and embeds the Collab Client with the selected Univerfile.
- Keep `REASONIX_UNIVER_PREVIEW_COMMAND` as an override for alternate machine-readable Preview URL providers.
- Manage the local preview sidecar on demand: start or discover it when needed, reuse it during the desktop process, and shut down sidecars that an override provider explicitly marks as managed.
- Select the preview target from explicit Workspace panel selection first, with optional inference from unambiguous agent activity that names a `.univer` path.
- Embed the returned Collab Client surface as-is and pass through its interactions.
- Show preview capability failures inside the Workspace preview surface, without appending them to the chat transcript or attempting automatic install or upgrade.
- Keep Preview URL and path exposure local-only; do not upload or record full preview paths in telemetry.

## Capabilities

### New Capabilities

- `live-univer-preview`: Reasonix Desktop can open and manage a live Univerfile preview from the Workspace panel using a local Univer preview capability.

### Modified Capabilities

None.

## Impact

- Desktop Go bindings and process lifecycle code for invoking the Univer daemon preview provider or override Preview Command.
- Desktop frontend bridge types, mock bindings, and Workspace panel preview UI.
- Workspace preview target selection logic based on `.univer` file selection and agent activity.
- Tests for command parsing, sidecar lifecycle, target priority, failure surfaces, and path privacy.
- External runtime dependency on the Univer CLI daemon JSON contract and daemon-served Collab Client assets.
