# Uniwork contracts negotiate protocol version

The Uniwork Package, embedding host, and Univer executable or daemon will use an explicit Uniwork Protocol Version and typed incompatibility failures instead of relying on package versions, string parsing, or silent fallback. This lets Reasonix and other hosts explain surface-host or host-tooling mismatches clearly when `@univer/uniwork`, host code, and Univer tooling are released independently.

**Status**: accepted
