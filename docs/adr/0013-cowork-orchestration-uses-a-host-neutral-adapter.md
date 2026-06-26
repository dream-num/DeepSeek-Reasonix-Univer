# Cowork orchestration uses a host-neutral adapter

`@univer/cowork` will use inversion of control for host orchestration: the package defines a Cowork Host Adapter contract, and each embedding agent app implements that contract with its own bridge, daemon, permissions, and workspace model. The Cowork Surface may connect directly to Univer Gateway Endpoints for realtime document traffic, but host actions such as commands, retries, target changes, and user-visible events flow through the host-neutral adapter rather than depending on Reasonix, Wails, or Go.

**Status**: accepted
