Package.describe({
    name: 'jorgenvatle:vite',
    version: '1.0.4',
    summary: `⚡ Speeds up Meteor's build and HMR processes using Vite`,
    documentation: 'README.md'
});

Package.registerBuildPlugin({
    name: 'vite',
    use: [
        'ecmascript@0.16.9 || 0.16.10',
    ],
    sources: [
        'dist/build-plugin.mjs',
    ],
});

Package.onUse((api) => {
    api.versionsFrom(['3.0', '3.1']);
    api.use([
        'isobuild:compiler-plugin@1.0.0',
        'ecmascript',
        'server-render',
        'webapp',
        'mongo',
    ]);

    api.mainModule('dist/package-runtime.mjs', ['server'], { bare: false });
    api.addFiles('src/dependencies.js'); // un-lazy-load dependencies.
});