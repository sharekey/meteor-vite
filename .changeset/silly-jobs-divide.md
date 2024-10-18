---
"meteor-vite": patch
"vite-bundler": patch
---

Allow Vite dev server to run without a DDP connection.
- Fix Meteor DDP URL parsing from Meteor runtime environment. Falls back to using `MOBILE_DDP_URL`. 
- Fix #208