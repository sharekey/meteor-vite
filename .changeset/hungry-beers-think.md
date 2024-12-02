---
"meteor-vite": patch
---

Fix issue where meteor-vite would not be loaded with apps not using the experimental [`serverEntry`](https://github.com/JorgenVatle/meteor-vite/blob/54005deb4da08cbdafd7a31739c60ff223c8c2ee/README.md#configuration) option for building the Meteor server with Vite.
- #246