# Transcript persists Uniwork blocks, not components

Reasonix Uniwork Sessions will persist typed Uniwork Blocks in the transcript rather than React component state or ad hoc rendered markup. The host transcript model owns serialization, replay, export, and migration, while `@univer/uniwork` components or headless primitives render those blocks at runtime.

**Status**: accepted
