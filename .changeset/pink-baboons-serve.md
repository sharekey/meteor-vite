---
"meteor-vite": minor
"vite-bundler": minor
---

Refactor IPC between Meteor and the Vite Dev Server to use DDP whenever possible.
- Updated peer dependency for Vite to allow Vite v5. Meteor v2 users still need to use Vite v4 as v5 dropped support for Node v14 - the Node.js version used by Meteor. 

### Compatability Notes
- `jorgenvatle:vite-bundler` now requires `meteor-vite@ >= v1.11.0`.
- This release only affects development builds. But it now assumes your development server is accessible locally over
DDP. If you bind Meteor to an IP address that for some reason is not accessible to other processes, you may run into 
issues where the Vite Dev Server won't start.
