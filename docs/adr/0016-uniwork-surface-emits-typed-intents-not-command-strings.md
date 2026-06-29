# Uniwork Surface emits typed intents, not command strings

`@univer/uniwork` will expose a typed Uniwork Intent catalog for host actions and will not pass shell or CLI command strings through the frontend surface. The host maps accepted intents to its own executable, daemon, IPC, HTTP, permission, logging, and path-redaction mechanisms, which keeps the package reusable across Reasonix and other agent hosts.

**Status**: accepted
