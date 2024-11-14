---
"vite-bundler": minor
---

Use any available IPC interface for workers instead of relying on one transport strategy

## Todo
- [ ] Include React preamble as part of the dev server boilerplate to simplify the setup necessary for React apps.
- [ ] Update documentation to reflect change to instruct users to remove any hardcoded preamble.
- [ ] Add module in place of the old `getConfig()` client utility instructing users on what to remove from their app to 
avoid inadvertently breaking all development environments dependent on that utility, keeping the original functionality.
- [ ] Add check for `meteor-node-stubs` - #240