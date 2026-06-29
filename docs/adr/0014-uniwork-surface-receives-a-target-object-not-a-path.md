# Uniwork Surface receives a target object, not a path

Uniwork Mode will pass a host-provided Uniwork Target object into the Uniwork Surface instead of passing only a `.univer` path. V1 preview can remain path-oriented, but V2 needs one explicit object for the Univerfile identity, current view, gateway endpoint, health, and supported host capabilities so target context does not leak into scattered props or force the Uniwork package to discover host state on its own.

**Status**: accepted
