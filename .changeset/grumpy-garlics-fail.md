---
"meteor-vite": minor
---

Disable Meteor package stubs when building for the server. This addresses some strange context issues with packages like redis-oplog when using stubs in intermediary server server bundle. The stubs are really only necessary in the server runtime environment, so this should be the safest way to build anyway.
