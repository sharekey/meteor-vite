---
"vite-bundler": minor
---

Add minimal support for Meteor v3 (#83)

- Refactor internal Vite dev server config store to use async collection methods rather than relying on Fibers.
- Increased minimum Meteor version requirement to v2.8.2
- Add previously missing `mongo` dependency to `package.js` dependencies.

Todo:
- [ ] Update Meteor bundle parser to handle new bundle format from v3. (#81) 