import { WebApp } from 'meteor/webapp';
import { Script, constants } from 'vm';
import { CurrentConfig } from './util/CurrentConfig';
import type * as BootstrapScripts from 'meteor-vite/bootstrap';

function runBootstrapScript<TScript extends keyof typeof BootstrapScripts>(script: TScript): Promise<ReturnType<typeof BootstrapScripts[TScript]>> {
    return new Script(`import('meteor-vite/bootstrap').then(scripts => scripts.${script}())`, {
        filename: CurrentConfig.bootstrapEvalFilename,
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
    }).runInThisContext()
}


try {
    await runBootstrapScript('initializeViteDevServer');
    console.log('Vite should be ready to go!');
}  catch (error) {
    console.warn('Failed to start Vite dev server!');
    console.error(error);
    
    WebApp.handlers.use('/', (req, res, next) => {
        // Todo: make this beautiful.
        res.writeHead(500);
        res.end([
            'Vite dev server failed to start!',
            '',
            error.stack,
        ].join('\n'))
    })
}


export {}
