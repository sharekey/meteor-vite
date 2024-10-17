---
"meteor-vite": minor
"vite-bundler": minor
---

Refactor IPC between Meteor and the Vite Dev Server to use DDP whenever possible.
- Updated peer dependency for Vite to allow Vite v5. Meteor v2 users still need to use Vite v4 as v5 dropped support for Node v14 - the Node.js version used by Meteor.

### Build Meteor Server with Vite (experimental)
Added an option to bundle the Meteor server with Vite. Bundles all your server assets into a single module before 
passing it onto the Meteor compiler. This should significantly reduce the load on Meteor's dependency tracker, leading
to much faster time-to-restart times in development.

Also comes with the added flexibility provided by Vite and its plugin ecosystem. Lets you take full control over what
code is imported on the server and how it's transformed.

```ts
// vite.config.ts
export default defineConfig({
    plugins: [
        meteor({
            clientEntry: './client/main.vite.ts',
            serverEntry: './server/main.vite.ts', // Write your server code from this entrypoint.
        })
    ]
});
```

```json5
// package.json
{
  "meteor": {
    "mainModule": {
      "client": "./client/main.meteor.js",
      // Create an empty main.meteor.js file in your server directory.
      // This will be populated with your final Vite-built server bundle.
      "server": "./server/main.meteor.js", 
    }
  }
}
```

### Compatability Notes
- `jorgenvatle:vite-bundler` now requires `meteor-vite@ >= v1.11.0`.
- This release only affects development builds. But it now assumes your development server is accessible locally over
DDP. If you bind Meteor to an IP address that for some reason is not accessible to other processes, you may run into 
issues where the Vite Dev server won't start.

### Resolves issues
- #195
- #179