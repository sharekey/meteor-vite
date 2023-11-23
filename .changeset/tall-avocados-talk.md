---
"meteor-vite": minor
"vite-bundler": minor
---

Use temporary file in `meteor-vite` npm package to feed Vite bundle into Meteor for production.
  - Run build cleanup before creating a new Vite bundle.
  - Default Meteor stub validator to warnOnly when running in production mode.
  - Add SolidJS example app

Fixes #34
Fixes Akryum/meteor-vite#33
Fixes meteor/meteor#12594
---