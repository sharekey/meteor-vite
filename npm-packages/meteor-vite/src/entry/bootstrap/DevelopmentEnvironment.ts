import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import Path from 'path';
import { createServer, createServerModuleRunner } from 'vite';
import { setBoilerplate } from './lib/RuntimeConfig';
import { CurrentConfig, resolveMeteorViteConfig } from './lib/Config';
import Instance from './lib/Instance';

Meteor.startup(async () => {
    const { projectRoot } = globalThis.MeteorViteRuntimeConfig;
    const { config, needsReactPreamble } = await resolveMeteorViteConfig({
        mode: 'development',
    }, 'serve');
    
    const server = await createServer(config);
    
    const modules = {
        clientEntry: Path.relative(projectRoot,
            CurrentConfig.clientEntryModule || config.meteor.clientEntry /* <- Addresses older versions of jorgenvatle:vite */
        ),
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
    
    
    // ⚡ [Client] Prepare module import scripts for the Meteor app HTML.
    const scripts = [
        Path.join(config.base, '@vite/client'),
        Path.join(config.base, modules.clientEntry)
    ].map((url) => {
        let absoluteUrl = url;
        
        if (!absoluteUrl.match(/https?:/)) {
            absoluteUrl = Meteor.absoluteUrl(url)
        }
        
        return `<script src="${absoluteUrl}" type="module" crossorigin></script>`;
    });
    
    // ⚡ [Client/React] Add React HMR preamble
    if (needsReactPreamble) {
        scripts.unshift(`
                <script type="module">
                    import RefreshRuntime from "${Meteor.absoluteUrl(Path.join(config.base, '@react-refresh'))}"
                    RefreshRuntime.injectIntoGlobalHook(window)
                    window.$RefreshReg$ = () => {}
                    window.$RefreshSig$ = () => (type) => type
                    window.__vite_plugin_react_preamble_installed__ = true
                </script>
            `)
    }
    
    await setBoilerplate({ head: scripts });
    await import('./CommonEnvironment');
    
    // ⚡ [Vite] Bind Vite to Meteor's Express app to serve modules and assets to clients.
    WebApp.handlers.use(server.middlewares);
    Instance.printUrls(config);
})