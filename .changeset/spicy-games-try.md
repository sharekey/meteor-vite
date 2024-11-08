---
"vite-bundler": patch
---

Prevent Vite dev server from launching a worker process before it is really necessary. Fixes an issue where test environments can get stuck waiting for the worker to exit.
