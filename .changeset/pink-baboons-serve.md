---
"meteor-vite": minor
"vite-bundler": minor
---

Refactor IPC between Meteor and the Vite Dev Server to use DDP whenever possible.

### Compatability Notes
- `jorgenvatle:vite-bundler` now requires `meteor-vite@ >= v1.11.0`.
- This release only affects development builds. But it now assumes your development server is accessible locally over
DDP. If you bind Meteor to an IP address that for some reason is not accessible to other processes, you may run into 
issues where the Vite Dev Server won't start.
