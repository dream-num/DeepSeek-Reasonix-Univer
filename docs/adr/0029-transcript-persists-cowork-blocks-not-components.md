# Transcript persists Cowork blocks, not components

Reasonix Cowork Sessions will persist typed Cowork Blocks in the transcript rather than React component state or ad hoc rendered markup. The host transcript model owns serialization, replay, export, and migration, while `@univer/cowork` components or headless primitives render those blocks at runtime.

**Status**: accepted
