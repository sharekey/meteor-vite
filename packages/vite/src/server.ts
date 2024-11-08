import Path from 'path';
import { Script, constants } from 'vm';
import { CurrentConfig } from './util/CurrentConfig';
import type * as BootstrapScripts from 'meteor-vite/bootstrap';

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

function runBootstrapScript<TScript extends keyof typeof BootstrapScripts>(script: TScript): Promise<ReturnType<typeof BootstrapScripts[TScript]>> {
    return new Script(`import('meteor-vite/bootstrap').then(scripts => scripts.${script}())`, {
        filename: CurrentConfig.bootstrapEvalFilename,
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
    }).runInThisContext()
}

async function startDevServerFromMeteor() {
    const { createServer, resolveConfig } = await importVm('vite');
    const { meteor } = await importVm('meteor-vite/plugin');
    const config = await resolveConfig({
        mode: 'development',
        configFile: CurrentConfig.configFile,
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
}

async function startDevServerUsingAssets() {
    const ViteServer = new Script(await Assets.getTextAsync('assets/dev-server.ts'), {
        filename: CurrentConfig.bootstrapEvalFilename,
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
    });
    
    const result = await ViteServer.runInThisContext() ;
}


await runBootstrapScript('initializeViteDevServer');
console.log('Vite should be ready to go!');

export {}
