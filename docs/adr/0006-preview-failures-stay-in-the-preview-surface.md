# Preview failures stay in the preview surface

Reasonix Desktop will report missing Univer daemon preview support, override Preview Command failure, sidecar startup failure, or Preview URL load failure inside the Workspace preview area with a retry path. These failures are not appended to the chat transcript and do not trigger automatic installation or upgrades of Univer tooling, because Live Univer Preview is a workspace capability rather than part of the agent turn itself.

**Status**: accepted
