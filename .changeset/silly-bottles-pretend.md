---
"vite-bundler": patch
---

Fix issue where server would exit prematurely if worker child process disconnects despite having an active DDP connection to the worker.
