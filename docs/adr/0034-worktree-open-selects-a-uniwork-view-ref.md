# Worktree open selects a Uniwork View Ref

Opening a Worktree in Uniwork should select a Uniwork View Ref on the active Uniwork Target rather than launching a separate Worktree viewer. The selected ref is a render scope backed by Collab Gateway runtime configuration: trunk omits `worktreeId`, worktree scope includes `worktreeId`, and merge preview scope uses gateway preview data for the selected unit. Reasonix persists and forwards the Uniwork-facing target/scope projection without persisting raw `/uf` URL construction details.

**Status**: accepted
