---
"vite-bundler": minor
---

Use any available IPC interface for workers instead of relying on one transport strategy
- Automatically include React preamble in apps that depend on `@vitejs/plugin-react`. You no longer need to manually modify your Meteor HTML to inject this yourself. See migration steps below.
- Added a check to warn you if your app is missing `meteor-node-stubs`. Addresses some potentially confusing runtime errors:
  - #239
- Use `semver` package instead of a custom parser when determining whether `meteor-vite` is out of date.
- Use `package-lock.json` instead of `package.json` when determining whether `meteor-vite` is out of date.

### Migration steps
If your app is using `@vitejs/plugin-react` and was created using the 
[Meteor-Vite React example app](https://github.com/JorgenVatle/meteor-vite/tree/d3633cb015206cb61168fa135c33b89331afeb04/examples/react), 
make sure you remove the [`react-refresh.js`](https://github.com/JorgenVatle/meteor-vite/blob/d3633cb015206cb61168fa135c33b89331afeb04/examples/react/server/react-refresh.js) compatability module. 
This is now handled automatically by Meteor-Vite when `@vitejs/plugin-react` is installed as a dependency.