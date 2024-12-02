---
"jorgenvatle_vite": major
"meteor-vite": major
---

Upgrade to Vite v6

## ⚡  Added lightning fast server-side HMR through Vite's new Environments API.

- Vite can now take over the entire build process for the your Meteor server code. This is an improved iteration of the `serverEntry` option introduced in [`jorgenvatle:vite-bundler@2.1.0`](https://github.com/JorgenVatle/meteor-vite/releases/tag/vite-bundler%402.1.2)
    - It does not require any intermediary pre-bundling step and is done at runtime.
    -  Changes you make to server code benefit from the same near-instant HMR that you get on the client.
    - Your Meteor server no longer needs to restart in-between changes you make changes to it.
- Vite now runs as a part of the Meteor runtime.
    - HMR and assets are served through Meteor's own web server, dropping the need to manage more than one host in development. Should make things a lot easier to deal with if you need to expose the dev server to the local network, particularly for Cordova.
- In production, the same changes from https://github.com/JorgenVatle/meteor-vite/pull/173 apply. Your assets are built and served as static files without the need for pushing them through Meteor's build system.
- Client assets benefit from code splitting. What's not immediately required on first page load will be prefetched quietly in the background by the browser.

Building the Meteor server with Vite is still in its experimental phase. To provide HMR for the server, modules with side-effects need to be cleaned up between changes. Currently we clear out your method and publication handlers between updates to prevent `Mongo.Collection` from yelling at you for defining/instantiating them twice. But there likely is a list of other things that might be other things that need to be cleaned up between reloads. Looking forward to any feedback on this.
- If you run into issues, you can always just comment out the `serverEntry` field in your Vite config and it should behave just like previous versions of Meteor Vite.

## Migration steps
`jorgenvatle:vite-bundler` has been renamed to `jorgenvatle:vite`.

```sh
meteor remove jorgenvatle:vite-bundler
meteor add jorgenvatle:vite
```

## Breaking changes
- Since Vite v5, support for Node.js v14 was dropped. Since this release depends on Vite v6, Meteor v2 support is no longer possible.

