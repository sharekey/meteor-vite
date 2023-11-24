---
"vite-bundler": patch
---

Fix mainModule validation running before `VITE_METEOR_DISABLED` environment checks

- Refactor file paths and internal notes for Vite bundle entry module.
- Handle empty parent directory for final Vite bundle's entry module.
