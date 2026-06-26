# Cowork integration consumes versioned Univer packages

Reasonix Desktop will integrate deeper Univer behavior through stable runtime contracts and small versioned Univer Capability Packages, not by source-owning the `univer-cli` repository as a product submodule. Submodules may still be used for local development, test pinning, or temporary cross-repo coordination, but the shipped Cowork Mode should depend on published packages, command/daemon contracts, and schemas that preserve each repository's release boundary.

**Status**: accepted
