# Reasonix Uniwork adapter stays in Reasonix

The Reasonix implementation of the Uniwork Host Adapter will stay inside the Reasonix repository rather than becoming a separate npm package. It is tightly coupled to Wails, Go methods, desktop settings, workspace/session state, and Reasonix process orchestration, while `@univer/uniwork` remains host-neutral.

**Status**: accepted
