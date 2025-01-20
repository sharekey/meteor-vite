---
"meteor-vite": patch
---

Place .gitignore file for temporary Vite bundle modules in temp dir root instead of the parent directory of the server entry. Addresses a concern where these temporary files might get accidentally commited into version control.
