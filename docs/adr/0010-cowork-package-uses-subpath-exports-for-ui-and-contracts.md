# Cowork package uses subpath exports for UI and contracts

Univer will expose Cowork frontend integration as one package, `@univer/cowork`, so Reasonix Desktop imports one integration dependency. The package will still separate heavy frontend embedding from lightweight contracts through subpath exports such as `@univer/cowork/contracts`, while Reasonix Go remains responsible for invoking the `univer` executable or daemon JSON contract for Univerfile operations and process lifecycle.

**Status**: accepted
