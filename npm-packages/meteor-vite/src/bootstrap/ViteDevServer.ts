import type * as _ from  'meteor/jorgenvatle:vite';
import { createServer, resolveConfig, type ViteDevServer } from 'vite';
import { meteorWorker } from '../plugin/Meteor';

/**
 * Helper function for Meteor to launch the Vite dev server within a virtual context.
 * This is called internally by the jorgenvatle:vite package when
 * starting Meteor in a development environment.
 */
export async function initializeViteDevServer(): Promise<ViteDevServer> {
    const { packageJson, projectRoot } = globalThis.MeteorViteRuntimeConfig;
    const config = await resolveConfig({
        configFile: packageJson.meteor.vite?.configFile
    }, 'serve');
    
    const server = await createServer({
        mode: 'development',
        configFile: config.configFile,
        root: projectRoot,
        plugins: [
            meteorWorker({
                meteorStubs: { packageJson }
            })
        ]
    });
    
    await server.listen();
    server.printUrls();
    
    return server;
}