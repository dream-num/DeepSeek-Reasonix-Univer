# Cowork View Refs align with Collab Gateway scopes

Cowork contracts will expose a generalized Cowork View Ref model that aligns with Collab Gateway render scopes rather than a Reasonix-specific read-service model. A ref can select trunk, a concrete `worktreeId`, or merge preview data for a selected unit, and `@univer/cowork` should use Univer tooling contracts such as `buildRuntimeConfig`, `UnitSummary`, and merge preview responses to render that scope. The public Cowork API should not expose implementation class names or raw `/uf` URL construction details; Reasonix receives or builds only the Cowork-facing target/scope projection.

**Status**: accepted
