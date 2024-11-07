Package.describe({
    name: 'jorgenvatle:vite',
    version: '1.0.0',
    summary: '',
});

Package.registerBuildPlugin({
    name: 'vite',
    use: [],
    sources: [
        'src/plugin.js',
    ],
});

Npm.depends({
    vite: '6.0.0-alpha.24',
})

Package.onUse((api) => {
    api.versionsFrom(['3.0']);
    api.use([
        'isobuild:compiler-plugin',
        'ecmascript'
    ]);

    api.mainModule('dist/server.mjs', ['server'], { bare: false });
});