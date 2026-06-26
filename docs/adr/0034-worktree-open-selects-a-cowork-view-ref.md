# Worktree open selects a Cowork View Ref

Opening a Worktree in Cowork should select a Cowork View Ref on the active Cowork Target rather than launching a separate Worktree viewer. The selected ref is a render scope backed by Collab Gateway runtime configuration: trunk omits `worktreeId`, worktree scope includes `worktreeId`, and merge preview scope uses gateway preview data for the selected unit. Reasonix persists and forwards the Cowork-facing target/scope projection without persisting raw `/uf` URL construction details.

**Status**: accepted
