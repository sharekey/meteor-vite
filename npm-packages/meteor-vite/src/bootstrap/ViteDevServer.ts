import FS from 'node:fs';
import { createServer, resolveConfig, type ViteDevServer } from 'vite';
import { meteorWorker } from '../plugin/Meteor';
import type { ProjectJson } from '../VitePluginSettings';

/**
 * Helper function for Meteor to launch the Vite dev server within a virtual context.
 * This is called internally by the jorgenvatle:vite package when
 * starting Meteor in a development environment.
 */
export async function initializeViteDevServer(): Promise<ViteDevServer> {
    const { packageJson } = resolveContext();
    const config = await resolveConfig({
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
    
    return server;
}

function resolveContext(): { packageJson: ProjectJson } {
    return {
        packageJson: JSON.parse(FS.readFileSync('package.json', 'utf8'))
    }
}