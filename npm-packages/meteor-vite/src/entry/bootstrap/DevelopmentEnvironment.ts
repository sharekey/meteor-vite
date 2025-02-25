import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import Path from 'path';
import { createServer, createServerModuleRunner } from 'vite';
import { resolveMeteorViteConfig } from './lib/Config';
import Instance from './lib/Instance';

Meteor.startup(async () => {
    const { config, modules } = await resolveMeteorViteConfig({
        mode: 'development',
    }, 'serve');
    
    const server = await createServer(config);
    
    await server.warmupRequest(modules.clientEntry);
    
    // ⚡ [Server] Transform and load the Meteor main module using Vite.
    if (modules.serverEntry) {
        const runner = createServerModuleRunner(server.environments.server);
        Instance.logger.info(`Loading server entry: ${modules.serverEntry}`);
        
        // HMR listener to clean up side-effects from things like
        // Meteor.publish(), new Mongo.Collection(), etc. on server-side hot reload.
        await runner.import('meteor-vite/bootstrap/RuntimeHMR');
        
        await runner.import(modules.serverEntry);
    }
    
    // ⚡ [Vite] Bind Vite to Meteor's Express app to serve modules and assets to clients.
    WebApp.handlers.use(server.middlewares);
    Instance.printUrls(config);
})