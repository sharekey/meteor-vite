---
"vite-bundler": patch
---

Directly import Vite bundle instead of using a proxy module for importing the bundle. This works around an issue in Meteor v3 where proxy modules wouldn't hit Meteor's build plugin system.
