---
"meteor-vite": patch
---

Remove misplaced debug logger and expand information provided with unrecognized module method warnings.
- Fix issue where Meteor package stubs would try to import directly from packages' full mainModule path (e.g. `meteor/ostrio:cookies/main.js`) rather than using the actually requested module path (e.g. `meteor/ostrio:cookies`). Resolves some issues where some package exports would show up as not found or undefined. 
