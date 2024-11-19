---
"meteor-vite": patch
---

Fall back to importing from package root if subpath import fails. This is a temporary fix to address server compatability as the package parser currently only scans for exports in web.browser.
