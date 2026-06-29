## 1. Preview Provider Integration

- [x] 1.1 Confirm the real Univer tooling preview provider after OTime lands the gateway integration: `univer daemon status --json` exposes `collabGateway.viewUrl`, and the Collab Client uses `?file=<absolute .univer path>`.
- [x] 1.2 Add a Go preview provider runner that accepts an absolute `.univer` path, starts/discovers the daemon, and supports an override JSON Preview Command.
- [x] 1.3 Add tests for success, missing command, non-zero exit, invalid JSON, and path redaction behavior.

## 2. Sidecar Lifecycle

- [x] 2.1 Add a desktop sidecar manager that starts or discovers the preview sidecar on first request.
- [x] 2.2 Reuse the sidecar across Preview Targets within one desktop process.
- [x] 2.3 Shut down Managed Sidecars on desktop shutdown while leaving discovered sidecars running.
- [x] 2.4 Add Go tests for managed versus discovered sidecar lifecycle.

## 3. Frontend Bridge and State

- [x] 3.1 Add Wails binding types and bridge mock methods for requesting Live Univer Preview.
- [x] 3.2 Add frontend state for Preview Target, Explicit Preview Target, loading, Preview URL, and Preview Failure.
- [x] 3.3 Detect Agent Preview Signals from unambiguous `.univer` paths in tool arguments, tool output, or workspace changes.
- [x] 3.4 Add tests for explicit target priority and ambiguous agent activity.

## 4. Workspace Panel UI

- [x] 4.1 Open Live Univer Preview when the user selects a `.univer` file in the Workspace panel.
- [x] 4.2 Embed the returned Preview URL in the Workspace preview area.
- [x] 4.3 Display loading, retry, and failure states without appending to the chat transcript.
- [x] 4.4 Preserve existing preview behavior for non-`.univer` files.
- [x] 4.5 Add frontend tests for `.univer` selection, non-Univer fallback, retry, and preview failure state.

## 5. Verification

- [x] 5.1 Run desktop frontend typecheck and focused frontend tests.
- [x] 5.2 Run focused Go tests for the preview command and sidecar manager.
- [x] 5.3 Smoke the OTime-provided daemon preview provider with a gateway-created `.univer`: packaged CLI build, `daemon status --json`, Collab Client page URL, `/units`, and snapshot endpoint.
- [x] 5.4 Perform a manual macOS desktop smoke test in the Reasonix Wails shell with a gateway-readable `.univer` file.
