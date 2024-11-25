---
"jorgenvatle_vite": patch
---

Wrap dev server bootstrapper around Meteor.startup hook. Workaround for issue where changes to Meteor.settings.public aren't sent to clients. Ref: https://github.com/meteor/meteor/issues/13489
