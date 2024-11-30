---
"meteor-vite": patch
---

Include hash in entry module filenames. Addresses a critical issue where older entry modules would be kept (almost) indefinitely by client and edge caches.
