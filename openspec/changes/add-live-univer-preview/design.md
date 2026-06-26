## Context

Reasonix Desktop is a Wails shell around the Go Reasonix kernel. The frontend calls bound Go methods directly and receives runtime events; it does not route normal desktop interactions through HTTP. The current Workspace panel can preview text and media files, but it does not render `.univer` content.

Univer's `collab-client` is an independent browser app that expects a Collab Gateway serving `/uf/...` HTTP, WebSocket, and SSE endpoints. Its frontend assets and protocol must stay aligned with Univer tooling. Current `univer-cli` dev exposes that client through the user-level daemon: `univer daemon status --json` returns `collabGateway.viewUrl`, and `collab-client` selects a file with the documented `?file=<absolute .univer path>` query.

## Goals / Non-Goals

**Goals:**

- Let users view a live `.univer` file inside the Reasonix Desktop Workspace panel.
- Keep Reasonix's dependency on Univer tooling narrow: use the daemon JSON contract and embed the daemon-served Collab Client URL.
- Treat Univer CLI internals and Collab Client interactions as opaque.
- Keep preview errors isolated to the preview surface.
- Avoid leaking full Preview URLs or `.univer` paths through telemetry.

**Non-Goals:**

- Reimplement the Collab Gateway protocol in Go.
- Bundle or rewrite `@univer/collab-client` inside the Reasonix frontend.
- Define read-only/editable/merge/discard behavior for the Collab Client.
- Support old Univer CLI write paths separately from the preview capability.
- Auto-install or auto-upgrade Univer tooling.

## Decisions

### Consume daemon view URL instead of constructing gateway API URLs

Reasonix will call `univer daemon status --json`, start the daemon with `univer daemon start` when needed, and parse `collabGateway.viewUrl`. It will build the iframe URL by adding the absolute `.univer` path as the Collab Client `file` query parameter. Reasonix will not assume ports, append `/uf` paths, or scrape human-readable output. If `REASONIX_UNIVER_PREVIEW_COMMAND` is set, Reasonix will use that override command and parse a JSON `url` or `previewUrl` envelope.

Alternatives considered:

- Import `@univer/collab-client` into Reasonix frontend. Rejected because the client/gateway versions must remain synchronized and the client is built as a standalone Vite app.
- Construct `/uf/<enc>` URLs in Reasonix. Rejected because that couples Reasonix to a protocol owned by Univer tooling.

### Manage sidecar lifecycle on demand

Reasonix will create a process-level sidecar manager. The first preview request starts or discovers the preview capability, later requests reuse it, and shutdown closes sidecars started by an override Preview Command. The default `univer daemon` is a user-level service and is treated as discovered even when Reasonix invoked `univer daemon start`.

Alternatives considered:

- Require users to manually start the gateway. Rejected because the Workspace preview should be a desktop capability, not a setup chore.
- Start the gateway at desktop launch. Rejected because most sessions do not need Univer preview and should not pay the startup cost.

### Embed the Collab Client as a passthrough surface

The frontend will display the Preview URL in a Workspace panel iframe or equivalent embedded webview surface. Reasonix owns placement, loading, retry, and target selection. The Collab Client owns all in-client interactions.

Alternatives considered:

- Wrap Collab Client controls in Reasonix-native UI. Rejected because it would split ownership of edit/merge/discard behavior.

### Explicit target selection takes priority

Clicking a `.univer` file in the Workspace panel creates an Explicit Preview Target. Agent activity may infer a target only when no explicit user target is active.

Alternatives considered:

- Always follow the latest agent activity. Rejected because it can steal focus from a file the user chose.
- Scan the workspace for `.univer` files. Rejected because it guesses intent and can be expensive in large workspaces.

## Risks / Trade-offs

- Daemon JSON or Collab Client URL contract changes in Univer tooling -> keep command invocation behind a small Go runner and keep `REASONIX_UNIVER_PREVIEW_COMMAND` as an override escape hatch.
- Sidecar startup can be slow -> show loading state in the preview pane and reuse the sidecar once started.
- Iframe URL may expose local paths -> treat Preview URL as local-only UI state and exclude it from telemetry/logging.
- Native webview iframe behavior may vary by platform -> add desktop/frontend tests for UI state and manually smoke test on macOS first; broaden platform checks before release.
- Current `univer import` output may still use the pre-gateway local storage schema; the daemon gateway smoke succeeds with gateway-created `.univer` files, while import-created files can fail at `/units` until Univer CLI write paths are fully unified with Collab Gateway.

## Migration Plan

1. Land the OpenSpec against the current Univer daemon JSON contract.
2. Implement the Go sidecar manager and frontend Workspace preview behind the `.univer` file path path.
3. Validate locally with a real `.univer` file and `univer daemon status/start`.
4. If the preview provider is unavailable, keep the feature dormant and show the preview failure state.

Rollback is straightforward: hide or disable `.univer` Live Preview while leaving existing Workspace file previews unchanged.

## Open Questions

- Should Reasonix expose a manual "clear explicit preview target" action in the Workspace panel, or is selecting another file enough for V1?
