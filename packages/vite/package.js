Package.describe({
    name: 'jorgenvatle:vite',
    version: '1.0.0',
    summary: `⚡ Speeds up Meteor's build and HMR processes using Vite`,
    documentation: 'README.md'
});

Package.registerBuildPlugin({
    name: 'vite',
    use: [
        'ecmascript'
    ],
    sources: [
        'dist/build.mjs',
    ],
});

Package.onUse((api) => {
    api.versionsFrom(['3.0']);
    api.use([
        'isobuild:compiler-plugin',
        'ecmascript'
    ]);

    api.mainModule('dist/server.mjs', ['server'], { bare: false });
});