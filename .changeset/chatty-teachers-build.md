---
"vite-bundler": minor
---

Use any available IPC interface for workers instead of relying on one transport strategy

- Automatically include React preamble in apps that depend on `@vitejs/plugin-react`. You no longer need to manually modify your Meteor HTML to inject this yourself. See migration steps below.
- Use `semver` package instead of a custom parser when determining whether `meteor-vite` is out of date.
- Use `package-lock.json` instead of `package.json` when determining whether `meteor-vite` is out of date.
- Added a check to warn you if your app is missing `meteor-node-stubs`. Addresses some potentially confusing runtime errors: #239

## Migration steps

If your app is using `@vitejs/plugin-react` and was created using the [Meteor-Vite React example app](https://github.com/JorgenVatle/meteor-vite/tree/d3633cb015206cb61168fa135c33b89331afeb04/examples/react), 
make sure you remove the [`server/react-refresh.js`](https://github.com/JorgenVatle/meteor-vite/blob/d3633cb015206cb61168fa135c33b89331afeb04/examples/react/server/react-refresh.js) compatability module from your app. 

```diff
// server/react-refresh.js
- /**
-  * Inject React Refresh snippet into HTML served by Meteor in development mode.
-  * Without this snippet, React HMR will not work with Meteor-Vite.
-  *
-  * {@link https://github.com/JorgenVatle/meteor-vite/issues/29}
-  * {@link https://github.com/vitejs/vite-plugin-react/issues/11#discussion_r430879201}
-  */
- if (Meteor.isDevelopment) {
-     WebAppInternals.registerBoilerplateDataCallback('react-preamble', async (request, data) => {
-         const { host, port } = await getConfig();
-         data.dynamicHead = data.dynamicHead || '';
-         data.dynamicHead += `
- <script type="module">
-   import RefreshRuntime from "http://${host}:${port}/@react-refresh"
-   RefreshRuntime.injectIntoGlobalHook(window)
-   window.$RefreshReg$ = () => {}
-   window.$RefreshSig$ = () => (type) => type
-   window.__vite_plugin_react_preamble_installed__ = true
- </script>
-     `
-     })
- }
```

The boilerplate is now added automatically by Meteor-Vite when `@vitejs/plugin-react` is detected as a dependency.