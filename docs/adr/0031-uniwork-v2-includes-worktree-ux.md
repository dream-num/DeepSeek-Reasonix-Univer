# Uniwork V2 includes Worktree UX

Uniwork V2 will include the Worktree UX as part of its first complete version rather than treating status, open, merge, and discard actions as later placeholders. The package and host contracts should support the current `@univer/collab-gateway-contract` model: `WorktreeStatus` (`open`, `ready`, `merged`, `discarded`), trunk/worktree scope selection, merge preview/conflict state, and user-confirmed merge or discard through Univer tooling. Structured Worktree diff is not part of the V2 completion definition unless Univer tooling first exposes that capability.

**Status**: accepted
