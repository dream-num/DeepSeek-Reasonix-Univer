# Cowork Target path is host-defined

Cowork Targets may include a path-like file field, but `@univer/cowork` treats it as host-defined display or source identity rather than filesystem authority. Reasonix can map that value to an absolute path inside its host adapter and Go orchestration, while other hosts can use relative paths, remote identifiers, or cloud workspace paths without forcing the Cowork package to perform local IO.

**Status**: accepted
