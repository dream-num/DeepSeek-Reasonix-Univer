# Univer tooling lifecycle is workspace scoped

Reasonix Uniwork orchestration should manage Univer tooling as a workspace-scoped session or process pool rather than starting one process per Uniwork Target. A workspace session can serve multiple targets and view refs, while Reasonix remains responsible for shutting down host-started processes and leaving discovered external tooling alone.

**Status**: accepted
