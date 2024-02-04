---
"vite-bundler": patch
---

Move Vite client bundle entry file into client directory instead of relying on augmenting the meteor-vite package 
contents. This addresses some spotty behaviour where the client bundle would occasionally not load in certain
environments, like projects managed through npm workspaces.
