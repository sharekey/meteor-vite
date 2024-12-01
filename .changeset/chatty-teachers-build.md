---
"vite-bundler": minor
---

Use any available IPC interface for workers instead of relying on one transport strategy
- Automatically include React preamble in apps that depend on `@vitejs/plugin-react`. You no longer need to manually modify your Meteor HTML to inject this yourself. See migration steps below.

### Migration steps
If your app is using `@vitejs/plugin-react` and was created using the 
[Meteor-Vite React example app](https://github.com/JorgenVatle/meteor-vite/tree/d3633cb015206cb61168fa135c33b89331afeb04/examples/react), 
make sure you remove the [`react-refresh.js`](https://github.com/JorgenVatle/meteor-vite/blob/d3633cb015206cb61168fa135c33b89331afeb04/examples/react/server/react-refresh.js) compatability module. 
This is now handled automatically by Meteor-Vite when `@vitejs/plugin-react` is installed as a dependency.

## Todo
- [x] Include React preamble as part of the dev server boilerplate to simplify the setup necessary for React apps.
- [ ] Update documentation to reflect change to instruct users to remove any hardcoded preamble.
- [x] Add module in place of the old `getConfig()` client utility instructing users on what to remove from their app to 
avoid inadvertently breaking all development environments dependent on that utility, keeping the original functionality.
- [ ] Add check for `meteor-node-stubs` - #239