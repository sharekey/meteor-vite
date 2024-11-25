import type * as _ from 'meteor/jorgenvatle:vite';
import { WebApp, WebAppInternals } from 'meteor/webapp';
import Path from 'path';
import {
    createServer,
    type ViteDevServer,
    createServerModuleRunner,
} from 'vite';
import { resolveMeteorViteConfig } from '../../../bootstrap/Config';
import Instance from '../../../bootstrap/Instance';

/**
 * Helper function for Meteor to launch the Vite dev server within a virtual context.
 * This is called internally by the jorgenvatle:vite package when
 * starting Meteor in a development environment.
 */
export async function initializeViteDevServer(): Promise<{ server: ViteDevServer, }> {
    Instance.printWelcomeMessage();
    Instance.logger.success('Initializing Vite Dev Server...');
    
    const { projectRoot } = globalThis.MeteorViteRuntimeConfig;
    const { config } = await resolveMeteorViteConfig({
        mode: 'development',
    }, 'serve');
    
    const server = await createServer(config);
    
    const modules = {
        clientEntry: Path.relative(projectRoot, config.meteor?.clientEntry || ''),
        serverEntry: config.meteor?.serverEntry && Path.resolve(config.meteor.serverEntry),
    }
    
    await server.warmupRequest(modules.clientEntry);
    
    // ⚡ [Server] Transform and load the Meteor main module using Vite.
    if (modules.serverEntry) {
        const runner = createServerModuleRunner(server.environments.server);
        Instance.logger.info(`Loading server entry: ${modules.serverEntry}`);
        
        // HMR listener to clean up side-effects from things like
        // Meteor.publish(), new Mongo.Collection(), etc. on server-side hot reload.
        await runner.import('meteor-vite/bootstrap/HMRServerCleanup');
        
        await runner.import(modules.serverEntry);
    }
    
    // ⚡ [Client] Inject module import scripts into the Meteor WebApp boilerplate.
    {
       Instance.logger.info('Registering boilerplate data callback...');
        const scriptTags = [
            Path.join(config.base, '@vite/client'),
            Path.join(config.base, modules.clientEntry)
        ].map((url) => {
            return `<script src="${url}" type="module" crossorigin></script>`
        });
        
        WebApp.handlers.use(server.middlewares);
        WebAppInternals.registerBoilerplateDataCallback('vite', (req, data) => {
            data.dynamicHead = data.dynamicHead || '';
            data.dynamicHead += scriptTags.join('\n');
        })
    }
    
    Instance.printUrls(config);
    
    return { server }
}
