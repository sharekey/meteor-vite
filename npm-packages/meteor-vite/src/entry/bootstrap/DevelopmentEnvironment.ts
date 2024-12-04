import { Meteor } from 'meteor/meteor';
import { WebApp, WebAppInternals } from 'meteor/webapp';
import Path from 'path';
import { createServer, createServerModuleRunner } from 'vite';
import { CurrentConfig, resolveMeteorViteConfig } from './lib/Config';
import Instance from './lib/Instance';

Meteor.startup(async () => {
    const { projectRoot } = globalThis.MeteorViteRuntimeConfig;
    const { config, needsReactPreamble } = await resolveMeteorViteConfig({
        mode: 'development',
    }, 'serve');
    
    const server = await createServer(config);
    
    const modules = {
        clientEntry: Path.relative(projectRoot, CurrentConfig.clientEntryModule),
        serverEntry: config.meteor?.serverEntry && Path.resolve(config.meteor.serverEntry),
    }
    
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
    
    // ⚡ [Client/React] Add React HMR preamble
    if (needsReactPreamble) {
        WebAppInternals.registerBoilerplateDataCallback('react-preamble', (req, data) => {
            data.dynamicHead = data.dynamicHead || '';
            
            // language=html
            data.dynamicHead += `
                <script type="module">
                    import RefreshRuntime from "${Meteor.absoluteUrl(Path.join(config.base, '@react-refresh'))}"
                    RefreshRuntime.injectIntoGlobalHook(window)
                    window.$RefreshReg$ = () => {}
                    window.$RefreshSig$ = () => (type) => type
                    window.__vite_plugin_react_preamble_installed__ = true
                </script>
            `;
        })
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
        
        WebAppInternals.registerBoilerplateDataCallback('vite', (req, data) => {
            data.dynamicHead = data.dynamicHead || '';
            data.dynamicHead += scriptTags.join('\n');
        })
    }
    
    // ⚡ [Vite] Bind Vite to Meteor's Express app to serve modules and assets to clients.
    WebApp.handlers.use(server.middlewares);
    Instance.printUrls(config);
})