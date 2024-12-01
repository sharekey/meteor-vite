---
"meteor-vite": major
"vite-bundler": major
---

Serve Vite bundle directly as static assets in production.
Skipping the Meteor bundling/transpilation steps for significantly faster build and client load times. ⚡

Upgrading to `v3` shouldn't require any changes to your application. But there are some changes that could potentially impact your users.

- Most of your application assets will be served from `/vite-assets/<chunkFileName>.<css | js>`
    - If you're using a CDN and serve your app under multiple hostnames, you might want to load those assets from one host instead of relative to the current host. This can be done by setting `assetsBaseUrl` in your `meteor-vite` plugin config.
    - Static assets served by Meteor does not have any CORS headers. You will have to apply these on your web server or use a CloudFlare transform rule if you're using a static host for your assets.
- [Browser support for ESM](https://caniuse.com/?search=ESM) is required. Global support is around 97% at the time of writing.