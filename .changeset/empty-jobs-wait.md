---
"meteor-vite": minor
"jorgenvatle_vite": minor
---

Re-implement assetsDir and assetsBaseUrl plugin options from Meteor-Vite v2.

- Addresses an issue where the `assetsBaseUrl` and `assetsDir` meteor-vite plugin options from previous versions of Meteor-Vite are ignored.
- Fixes an issue where Vite's `base` URL is always overriden by meteor-vite.  

### Issue references

- Fixes https://github.com/JorgenVatle/meteor-vite/issues/296
- Fixes https://github.com/JorgenVatle/meteor-vite/issues/271
