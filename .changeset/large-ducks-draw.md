---
"meteor-vite": patch
---

Fix issue where lazy-loaded server packages would have their import references added only to the client mainModule. 
- Fixes #285
