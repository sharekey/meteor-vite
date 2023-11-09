---
"vite-bundler": minor
---

Add option for users to pass through environment variables to the Vite dev server worker. Useful if for enabling the Vite debug logs or changing the Node environment.

Variable prefix `METEOR_VITE_WORKER_`.
`METEOR_VITE_WORKER_DEBUG="vite:_"` gets translated into `DEBUG="vite:_"`
