---
"jorgenvatle_vite": patch
---

Remove redundant warning message for multiple boilerplate inclusion attempts during build.

- Use Vite asset paths relative to the current host when no ROOT_URL or CDN_URL is set for the app.