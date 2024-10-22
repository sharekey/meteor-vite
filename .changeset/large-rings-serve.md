---
"meteor-vite": patch
"vite-bundler": patch
---

Build `serverEntry` bundles using Vite's SSR build process instead of using an inline browser build config.
- Resolves some of the configuration necessary to get the new server builds to work correctly. Default settings should now work for most users.
- SSR with Meteor can now be done entirely through Vite's build system.
- Import aliases no longer need to be defined in a Babel config if you intend to use them in server code. 

#### SSR example
- See the new [Vue + SSR](/examples/vue-ssr) example app to see it in action. Or check the [live preview](https://vue-ssr--meteor-vite.wcaserver.com)!   

#### Related issues
- #195
- #215
