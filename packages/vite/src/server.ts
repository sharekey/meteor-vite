import { WebAppInternals } from 'meteor/webapp';
import { Script, constants } from 'vm';
import { CurrentConfig } from './util/CurrentConfig';
import type * as BootstrapScripts from 'meteor-vite/bootstrap';
import { Meteor } from 'meteor/meteor';

function runBootstrapScript<TScript extends keyof typeof BootstrapScripts>(script: TScript): Promise<ReturnType<typeof BootstrapScripts[TScript]>> {
    return new Script(`import('meteor-vite/bootstrap').then(scripts => scripts.${script}())`, {
        filename: CurrentConfig.bootstrapEvalFilename,
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
    }).runInThisContext()
}


const { server, scriptTags } = await runBootstrapScript('initializeViteDevServer');
console.log('Vite should be ready to go!', server.resolvedUrls);

Meteor.startup(() => {
    WebAppInternals.registerBoilerplateDataCallback('vite', (req, data) => {
        data.dynamicHead = data.dynamicHead || '';
        data.dynamicHead += scriptTags.join('\n');
    })
})


export {}
