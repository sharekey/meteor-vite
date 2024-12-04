---
"meteor-vite": patch
---

Emit an informational exception if Meteor build plugin is missing a client entry module runtime setting. Addresses an issue where updating meteor-vite without updating the build plugin to a version where version validation was added. 
