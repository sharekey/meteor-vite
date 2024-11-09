import type * as BootstrapScripts from 'meteor-vite/bootstrap';
import { CurrentConfig } from './CurrentConfig';
import { Script, constants } from 'node:vm';

export function runBootstrapScript<TScript extends keyof typeof BootstrapScripts>(script: TScript): Promise<ReturnType<typeof BootstrapScripts[TScript]>> {
    return new Script(`import('meteor-vite/bootstrap').then(scripts => scripts.${script}())`, {
        filename: CurrentConfig.bootstrapEvalFilename,
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
    }).runInThisContext()
}