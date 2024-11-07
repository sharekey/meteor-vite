import { Script, constants } from 'vm';

// language=typescript
const ViteRuntime = new Script(`
    console.log('Preparing new Vite runtime environment');

    import('vite').then(async ({ createServer }) => {
        const server = createServer();
        await server.listen();
        server.printUrls();
    })
`, {
    importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
});

ViteRuntime.runInThisContext();
