# Host owns Cowork Target authority

The embedding host owns Cowork Target authority: it decides which target is active, whether that target is valid, and when a new target snapshot is passed to the Cowork Surface. `@univer/cowork` may keep UI-local state, but target changes are expressed as Cowork Intents for the host to accept or reject, preserving host workspace/session ownership and making the package reusable outside Reasonix.

**Status**: accepted
