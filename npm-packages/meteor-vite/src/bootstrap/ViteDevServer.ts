import type * as _ from  'meteor/jorgenvatle:vite';
import Path from 'path';
import {
    createServer,
    resolveConfig,
    type ViteDevServer,
    version,
    createNodeDevEnvironment,
    createServerHotChannel, createServerModuleRunner,
} from 'vite';
import { meteorWorker } from '../plugin/Meteor';
import Logger from '../utilities/Logger';
import type { ResolvedMeteorViteConfig } from '../VitePluginSettings';
import { type WebApp as WebApp_, type WebAppInternals as WebAppInternals_ } from 'meteor/webapp';

declare const WebApp: typeof WebApp_;
declare const WebAppInternals: typeof WebAppInternals_;

/**
 * Helper function for Meteor to launch the Vite dev server within a virtual context.
 * This is called internally by the jorgenvatle:vite package when
 * starting Meteor in a development environment.
 */
export async function initializeViteDevServer(): Promise<{ server: ViteDevServer, }> {
    Logger.info(`Vite version ${version} | Initializing Vite Dev Server...`);
    
    const { packageJson, projectRoot } = globalThis.MeteorViteRuntimeConfig;
    process.chdir(projectRoot);
    let config: ResolvedMeteorViteConfig = await resolveConfig({
        configFile: packageJson.meteor.vite?.configFile
    }, 'serve');
    
    const server = await createServer({
        base: 'vite',
        appType: 'custom',
        server: { middlewareMode: true, },
        mode: 'development',
        configFile: config.configFile,
        plugins: [
            meteorWorker({
                meteorStubs: { packageJson }
            })
        ],
        environments: {
            node: {
                dev: {
                    createEnvironment(name, config) {
                        return createNodeDevEnvironment(name, config, {
                            hot: createServerHotChannel(),
                        })
                    }
                }
            }
        }
    });
    
    config = server.config;
    
    // ⚡ [Server] Transform and load the Meteor main module using Vite.
    if (config.meteor?.serverEntry) {
        const runner = createServerModuleRunner(server.environments.node);
        const serverEntry = Path.resolve(config.meteor.serverEntry);
        console.log(`Loading server entry: ${serverEntry}`);
        
        // HMR listener to clean up side-effects from things like
        // Meteor.publish(), new Mongo.Collection(), etc. on server-side hot reload.
        await runner.import('meteor-vite/bootstrap/HMRServerCleanup');
        
        await runner.import(serverEntry);
    }
    
    // ⚡ [Client] Inject module import scripts into the Meteor WebApp boilerplate.
    {
        const scriptTags = [
            Path.join(config.base, '@vite/client'),
            Path.join(config.base, Path.relative(projectRoot, config.meteor?.clientEntry || '')),
        ].map((url) => {
            return `<script src="${url}" type="module" crossorigin></script>`
        });
        
        WebApp.handlers.use(server.middlewares);
        WebAppInternals.registerBoilerplateDataCallback('vite', (req, data) => {
            data.dynamicHead = data.dynamicHead || '';
            data.dynamicHead += scriptTags.join('\n');
        })
    }
    
    return { server }
}
