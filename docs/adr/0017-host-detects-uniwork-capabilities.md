# Host detects Uniwork capabilities

Uniwork capability detection belongs to the embedding host, not to `@univer/uniwork`. The host inspects its local executable, daemon, permissions, version, and workspace environment, then passes explicit target and host capabilities to the Uniwork Surface; the surface only renders available behavior and emits typed intents allowed by those capabilities.

**Status**: accepted
