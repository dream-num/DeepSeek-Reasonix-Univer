# Reasonix manages the preview sidecar on demand

Reasonix Desktop will start the local Univer preview sidecar only when the user or agent opens a Live Univer Preview, reuse it for later Preview Targets in the same app process, and shut down any sidecar it started when the desktop app exits. The desktop may discover an already-running sidecar, but V1 should not require the user to manually start one or pay the startup cost during normal Reasonix launch.

**Status**: accepted
