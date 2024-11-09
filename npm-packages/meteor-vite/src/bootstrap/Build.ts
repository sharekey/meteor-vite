import { build, createNodeDevEnvironment, resolveConfig } from 'vite';
import { meteorWorker } from '../plugin/Meteor';
import type { ResolvedMeteorViteConfig } from '../VitePluginSettings';

export async function buildForProduction() {
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