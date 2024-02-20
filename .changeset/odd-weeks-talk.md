---
"meteor-vite": minor
---

Add support for externalizing imports for npm packages bundled with Meteor

- Allows you to point Vite to the Meteor bundle for some or all imports of an npm package.
In most cases, you don't need to use this feature, but if you're using Meteor packages that
have peer npm-dependencies, you can avoid the dependency being included twice in your final
production bundle by hinting to Vite that this npm dependency is provided by Meteor.
```ts
import React from 'react' // This will import from your node_modules

// If you have a Meteor package that depends on React, then React will already be
// in your Meteor client bundle. So you can instruct Vite to not import from node_modules
import React from 'meteor:react' // This will import from your Meteor bundle
```