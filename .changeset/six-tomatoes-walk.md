---
"vite-bundler": patch
"meteor-vite": patch
---

Check for METEOR_LOCAL_DIR environment variable when preparing the default meteor-vite plugin config.

- Fixes #116
- Fixes https://github.com/Akryum/meteor-vite/issues/46