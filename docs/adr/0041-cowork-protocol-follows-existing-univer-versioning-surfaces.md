# Cowork protocol follows existing Univer collab surfaces

Cowork V2 specs must be derived from the current Univer tooling surfaces rather than inventing a parallel collab model. On current `univer-cli` `origin/dev`, the relevant source-of-truth packages are `packages/collab-gateway-contract`, `packages/collab-gateway`, and `packages/collab-client`.

The shared protocol should align with the existing concepts already implemented there: `WorktreeStatus` (`open`, `ready`, `merged`, `discarded`), `UnitSummary`, unit type constants, `WorktreeControlClient`, `buildRuntimeConfig`, lifecycle SSE events, merge preview responses, and concrete control-plane operations such as `createWorktree`, `commit`, `rollback`, `ready`, `merge`, `discard`, `previewMerge`, and `getMergePreviewUnit`. It should not expose raw storage tables, copied gateway URL construction, or the standalone V1 iframe handoff as the primary Cowork integration contract.

This means the detailed OpenSpecs should define a `cowork-protocol-v1` layer that adapts the existing `packages/collab*` surfaces into host-neutral package and host-adapter contracts, while `@univer/cowork` consumes the protocol and Reasonix remains responsible for desktop shell, approvals, transcript blocks, and local executable or daemon orchestration.

**Status**: accepted
