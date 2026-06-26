# Cowork package primary entrypoint is React

`@univer/cowork` will expose a React Cowork Surface as its primary frontend entrypoint because Reasonix Desktop already uses a React/Vite frontend and needs native composition with its mode, dock, loading, and error states. The package should also expose a lower-level mount API for non-React hosts or escape-hatch embedding, while keeping contracts available through lightweight subpath exports.

**Status**: accepted
