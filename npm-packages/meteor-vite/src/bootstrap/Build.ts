import { build, resolveConfig, version } from 'vite';
import { meteorWorker } from '../plugin/Meteor';
import Logger from '../utilities/Logger';
import type { ResolvedMeteorViteConfig } from '../VitePluginSettings';

export async function buildForProduction() {
    Logger.info(`Building with Vite v${version}...`);
    const { packageJson, projectRoot } = globalThis.MeteorViteRuntimeConfig;
    process.chdir(projectRoot);
    const config: ResolvedMeteorViteConfig = await resolveConfig({
        configFile: packageJson.meteor.vite?.configFile
    }, 'serve');
    
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
            outDir: config.meteor?.tempDir,
            rollupOptions: {
                input: config.meteor?.clientEntry,
            }
        }
    });
    
    // process the build
}