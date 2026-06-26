# Preview URL may carry the local Univerfile path

Reasonix Desktop may embed a local loopback Preview URL that includes the absolute `.univer` path when that is the contract exposed by Univer tooling. Reasonix must treat this as local-only preview state: it should not upload, persist in telemetry, or log the full Preview URL or path beyond what is needed for the user-visible preview.

**Status**: accepted
