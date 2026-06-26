# Univer daemon preview provider is the cross-tool contract

Reasonix Desktop will obtain Live Univer Preview through the Univer CLI daemon JSON contract. By default it reads `collabGateway.viewUrl` from `univer daemon status --json`, starts the daemon with `univer daemon start` when needed, and embeds the daemon-served Collab Client URL with `?file=<absolute .univer path>`. Reasonix will not scrape human stdout, assume a port, or construct `/uf` URLs itself. `REASONIX_UNIVER_PREVIEW_COMMAND` remains an override for alternate JSON Preview URL providers.

**Status**: accepted
