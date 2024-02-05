---
"vite-bundler": patch
---

Fix import path resolver for the Vite client bundle entry file. Addresses an incorrect import string with client mainModules outside of the Meteor client root directory.
