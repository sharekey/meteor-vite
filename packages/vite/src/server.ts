import { Script, constants } from 'vm';
import { CurrentConfig } from './util/CurrentConfig';
import type * as Vite from 'vite';

async function vite(): Promise<typeof Vite> {
    console.log('Preparing new Vite runtime environment');
    
    return new Script(`import('vite')`, {
        filename: CurrentConfig.bootstrapEvalFilename,
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
    }).runInThisContext()
}

const { createServer } = await vite();

const server = await createServer();
await server.listen();
server.printUrls();

console.log('Vite should be ready to go!');
