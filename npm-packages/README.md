# Vite plugin Zodern:Relay

This is a Vite compatability package for
[`zodern:relay`](https://github.com/zodern/meteor-relay#readme) - type safe
[Meteor](https://meteor.com/) methods and publications.

This plugin acts as partial replacement for the Babel plugin provided by `zodern:relay`. You still need the Babel
plugin as it might still be required on the server.

> [!IMPORTANT]
> This plugin is not yet fully complete. Methods and publications imported by your client will not be omitted from
> your client bundle like it would when using the `@zodern/babel-plugin-meteor-relay` plugin.

## Installation
```sh
npm i -D @meteor-vite/plugin-zodern-relay
```
## Configuration
Add the plugin to your Vite config and you're all set. There are no configuration options.
```ts
// vite.config.ts
import zodernRelay from '@meteor-vite/plugin-zodern-relay';
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
    plugins: [
        meteor({
            clientEntry: '...',
        }),
        zodernRelay(),
    ]
})
```

## Usage
You can use [`zodern:relay`](https://github.com/zodern/meteor-relay#readme) like you normally would. Consult their 
readme for documentation.

## License
MIT