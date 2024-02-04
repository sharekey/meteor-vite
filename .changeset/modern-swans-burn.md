---
"vite-bundler": patch
---

Move Vite client bundle entry file into client directory instead of relying on augmenting the meteor-vite package contents. This addresses some spotty behaviour in certain project setups. Particularly those with npm workspaces.
