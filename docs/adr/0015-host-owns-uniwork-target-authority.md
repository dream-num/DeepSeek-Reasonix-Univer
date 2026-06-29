# Host owns Uniwork Target authority

The embedding host owns Uniwork Target authority: it decides which target is active, whether that target is valid, and when a new target snapshot is passed to the Uniwork Surface. `@univer/uniwork` may keep UI-local state, but target changes are expressed as Uniwork Intents for the host to accept or reject, preserving host workspace/session ownership and making the package reusable outside Reasonix.

**Status**: accepted
