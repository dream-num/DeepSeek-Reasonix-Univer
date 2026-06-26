# Cowork contracts are unit-type aware

Cowork V2 contracts will model units explicitly instead of assuming spreadsheet-only targets. The shared contract should carry Collab Gateway unit type values for doc, sheet, and slide, while base remains reserved until Univer tooling supports it. Reasonix must enable only the unit types and actions reported by the active Univer tooling capability set, so a release can support sheet/doc/slide incrementally without inventing spreadsheet-only target assumptions.

**Status**: accepted
