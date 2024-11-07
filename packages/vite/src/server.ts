import Path from 'path';
import { Script, constants } from 'vm';
import { CurrentConfig } from './util/CurrentConfig';

interface VMs {
    vite: typeof import('vite'),
    'meteor-vite/plugin': typeof import('meteor-vite/plugin'),
}

async function importVm<TPath extends keyof VMs>(path: TPath): Promise<VMs[TPath]> {
    console.log('Preparing new Vite runtime environment');
    
    return new Script(`import('${path}')`, {
        filename: CurrentConfig.bootstrapEvalFilename,
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
    }).runInThisContext()
}

const { createServer, resolveConfig } = await importVm('vite');
const { meteor } = await importVm('meteor-vite/plugin');
const config = await resolveConfig({
    mode: 'development',
    configFile: Path.join(CurrentConfig.projectRoot, 'vite.config.ts'),
}, 'serve');

const server = await createServer({
    configFile: config.configFile,
    plugins: [
        meteor({
            meteorStubs: {
                packageJson: CurrentConfig.packageJson,
            }
        })
    ]
});
await server.listen();
server.printUrls();

console.log('Vite should be ready to go!');
