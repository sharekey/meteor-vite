---
"meteor-vite": patch
"vite-bundler": patch
---

Build `serverEntry` bundles using Vite's SSR build process instead of using an inline browser build config. Greatly
simplifying the setup necessary to implement SSR with Meteor.

- See the new [Vue + SSR](/examples/vue-ssr) example app to see it in action. Or check the [live preview](https://vue-ssr--meteor-vite.wcaserver.com)!   

Addresses issues mentioned in
- #195
- #215
