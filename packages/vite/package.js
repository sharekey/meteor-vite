Package.describe({
    name: 'jorgenvatle:vite',
    version: '1.0.0',
    summary: '',
});

Package.registerBuildPlugin({
    name: 'vite',
    use: [],
    sources: [
        'plugin.js',
    ],
});

Npm.depends({
    vite: '6.0.0-alpha.24',
})

Package.onUse((api) => {
    api.versionsFrom(['3.0']);
    api.use([
        'isobuild:compiler-plugin',
        'typescript'
    ]);

    api.mainModule('server/main.ts', ['server'], { bare: false });
});