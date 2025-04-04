---
"meteor-vite": minor
---

Externalize dependencies listed in package's dependencies. Earlier versions would bundle Babel parser and colorizer libraries into the package source leading to redundant code inclusion.
