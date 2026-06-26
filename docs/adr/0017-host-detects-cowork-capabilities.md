# Host detects Cowork capabilities

Cowork capability detection belongs to the embedding host, not to `@univer/cowork`. The host inspects its local executable, daemon, permissions, version, and workspace environment, then passes explicit target and host capabilities to the Cowork Surface; the surface only renders available behavior and emits typed intents allowed by those capabilities.

**Status**: accepted
