---
"jorgenvatle_vite": patch
---

Fix issue where Vite config files in node_modules would trigger Vite boilerplate injection into client app leading to the boilerplate being omitted/tree-shaken out of the app unless imported explicitly.
