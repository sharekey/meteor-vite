import Path from 'node:path';
import { Script, constants } from 'vm';
import { guessCwd } from './util/CurrentConfig';

// language=typescript
const ViteRuntime = new Script(`
    console.log('Preparing new Vite runtime environment');

    import('vite').then(async ({ createServer }) => {
        const server = createServer();
        await server.listen();
        server.printUrls();
    })
`, {
    filename: Path.join(guessCwd(), 'server', 'main.vite.ts'),
    importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
});

ViteRuntime.runInThisContext();
