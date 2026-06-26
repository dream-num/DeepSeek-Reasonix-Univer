# Live Univer Preview uses a local Collab Gateway sidecar

Reasonix Desktop will integrate Univer collaboration as a thin client in the first version: the desktop app starts or discovers a local Collab Gateway sidecar, then embeds the Collab Client surface to show the addressed Univerfile. The Collab Client assets are also served by Univer tooling; Reasonix consumes a Preview URL instead of bundling `@univer/collab-client` into the desktop frontend. Reasonix treats the Univer CLI's internal write path as opaque; it only depends on the observable preview capability. We are not copying the `/uf` protocol into Reasonix or rewriting `collab-client` as native Reasonix React components, because the gateway/client contract is still owned by Univer tooling and carries HTTP, WebSocket, and SSE behavior that should stay in one place.

**Status**: accepted
