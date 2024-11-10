import type { InputOption } from 'rollup';
import { build, version } from 'vite';
import { MeteorViteError } from '../error/MeteorViteError';
import { meteorWorker } from '../plugin/Meteor';
import Logger from '../utilities/Logger';
import { resolveMeteorViteConfig } from '../VitePluginSettings';

export async function buildForProduction() {
    Logger.info(`Building with Vite v${version}...`);
    const { packageJson, projectRoot } = globalThis.MeteorViteRuntimeConfig;
    process.chdir(projectRoot);
    const { config, buildConfig } = await resolveMeteorViteConfig({ mode: 'production' }, 'build');
    
    if (!config.meteor?.clientEntry) {
        throw new MeteorViteError('No client entrypoint specified in Vite config!')
    }
    
    const input: InputOption = {
        client: config.meteor.clientEntry,
    };
    
    
    if (config.meteor.serverEntry) {
        input.server = config.meteor.serverEntry;
    }
    
    // Todo: refactor to using a single shared configuration, utilizing the environments
    //  API to apply configuration specific to the client/server in a single module.
    const result = await build({
        base: '/vite',
        appType: 'custom',
        server: { middlewareMode: true, },
        mode: 'development',
        configFile: config.configFile,
        plugins: [
            meteorWorker({
                meteorStubs: { packageJson }
            })
        ],
        build: {
            manifest: 'vite-manifest.json',
            outDir: buildConfig.tempDir,
            rollupOptions: { input }
        },
    });
    
    // process the build
}