# Uniwork View Refs align with Collab Gateway scopes

Uniwork contracts will expose a generalized Uniwork View Ref model that aligns with Collab Gateway render scopes rather than a Reasonix-specific read-service model. A ref can select trunk, a concrete `worktreeId`, or merge preview data for a selected unit, and `@univer/uniwork` should use Univer tooling contracts such as `buildRuntimeConfig`, `UnitSummary`, and merge preview responses to render that scope. The public Uniwork API should not expose implementation class names or raw `/uf` URL construction details; Reasonix receives or builds only the Uniwork-facing target/scope projection.

**Status**: accepted
