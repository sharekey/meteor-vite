import type * as _ from  'meteor/jorgenvatle:vite';
import Path from 'path';
import { createServer, resolveConfig, type ViteDevServer } from 'vite';
import { meteorWorker } from '../plugin/Meteor';
import type { ResolvedMeteorViteConfig } from '../VitePluginSettings';

/**
 * Helper function for Meteor to launch the Vite dev server within a virtual context.
 * This is called internally by the jorgenvatle:vite package when
 * starting Meteor in a development environment.
 */
export async function initializeViteDevServer(): Promise<{ server: ViteDevServer, scriptTags: string[] }> {
    const { packageJson, projectRoot } = globalThis.MeteorViteRuntimeConfig;
    process.chdir(projectRoot);
    let config: ResolvedMeteorViteConfig = await resolveConfig({
        configFile: packageJson.meteor.vite?.configFile
    }, 'serve');
    
    const server = await createServer({
        mode: 'development',
        configFile: config.configFile,
        plugins: [
            meteorWorker({
                meteorStubs: { packageJson }
            })
        ]
    });
    
    
    await server.listen();
    server.printUrls();
    config = server.config;
    
    if (config.meteor?.serverEntry) {
        console.log(`Loading server entry: ${config.meteor.serverEntry}`);
        await server.ssrLoadModule(config.meteor.serverEntry);
    }
    
    const baseUrl = server.resolvedUrls?.network[0] || server.resolvedUrls?.local[0];
    const scriptTags = [
        `${baseUrl}@vite/client`,
        `${baseUrl}./${config.meteor?.clientEntry}`
    ].map((url) => {
        return `<script src="${url}" type="module" crossorigin></script>`
    });
    
    return { server, scriptTags };
}
