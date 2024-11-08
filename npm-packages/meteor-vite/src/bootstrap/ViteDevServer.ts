import type * as _ from  'meteor/jorgenvatle:vite';
import Path from 'path';
import { createServer, resolveConfig, type ViteDevServer, version } from 'vite';
import { meteorWorker } from '../plugin/Meteor';
import type { ResolvedMeteorViteConfig } from '../VitePluginSettings';
import { type WebApp as WebApp_, type WebAppInternals as WebAppInternals_ } from 'meteor/webapp';

declare const WebApp: typeof WebApp_;
declare const WebAppInternals: typeof WebAppInternals_;

/**
 * Helper function for Meteor to launch the Vite dev server within a virtual context.
 * This is called internally by the jorgenvatle:vite package when
 * starting Meteor in a development environment.
 */
export async function initializeViteDevServer(): Promise<{ server: ViteDevServer, scriptTags: string[] }> {
    Logger.info(`Vite version ${version} | Initializing Vite Dev Server...`);
    
    const { packageJson, projectRoot } = globalThis.MeteorViteRuntimeConfig;
    process.chdir(projectRoot);
    let config: ResolvedMeteorViteConfig = await resolveConfig({
        configFile: packageJson.meteor.vite?.configFile
    }, 'serve');
    
    const server = await createServer({
        appType: 'custom',
        server: { middlewareMode: true, },
        mode: 'development',
        configFile: config.configFile,
        plugins: [
            meteorWorker({
                meteorStubs: { packageJson }
            })
        ]
    });
    
    config = server.config;
    
    if (config.meteor?.serverEntry) {
        console.log(`Loading server entry: ${config.meteor.serverEntry}`);
        await server.ssrLoadModule(config.meteor.serverEntry);
    }
    
    const baseUrl = server.resolvedUrls?.network[0] || server.resolvedUrls?.local[0] || '//';
    const scriptTags = [
        Path.join(baseUrl, '@vite/client'),
        '/./'+ Path.relative(projectRoot, config.meteor?.clientEntry || ''),
    ].map((url) => {
        return `<script src="${url}" type="module" crossorigin></script>`
    });
    
    WebApp.handlers.use(server.middlewares);
    WebAppInternals.registerBoilerplateDataCallback('vite', (req, data) => {
        data.dynamicHead = data.dynamicHead || '';
        data.dynamicHead += scriptTags.join('\n');
    })
    
    return { server, scriptTags };
}
