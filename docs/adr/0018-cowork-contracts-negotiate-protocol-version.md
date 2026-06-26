# Cowork contracts negotiate protocol version

The Cowork Package, embedding host, and Univer executable or daemon will use an explicit Cowork Protocol Version and typed incompatibility failures instead of relying on package versions, string parsing, or silent fallback. This lets Reasonix and other hosts explain surface-host or host-tooling mismatches clearly when `@univer/cowork`, host code, and Univer tooling are released independently.

**Status**: accepted
