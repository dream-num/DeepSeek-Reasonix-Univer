# Univer tooling executes Worktree operations

Worktree merge, discard, and related semantic operations are executed by Univer tooling, not by `@univer/uniwork` frontend code or Reasonix document mutation logic. Uniwork components present the operation and emit typed intents, the host handles confirmation, permissions, logging, and process orchestration, and Univer tooling remains the authority for concrete Collab Gateway operations such as `commit`, `rollback`, `ready`, `merge`, `discard`, `previewMerge`, and `getMergePreviewUnit`. User-facing "accept" copy maps to the gateway `merge` operation.

**Status**: accepted
