import { createNodeDevEnvironment, createServerHotChannel, type InlineConfig, resolveConfig, version } from 'vite';
import { meteorWorker } from '../plugin/Meteor';
import Logger from '../utilities/Logger';
import { type ResolvedMeteorViteConfig } from '../VitePluginSettings';

export async function resolveMeteorViteConfig(
    inlineConfig: InlineConfig,
    command: 'build' | 'serve',
) {
    const { packageJson, projectRoot } = globalThis.MeteorViteRuntimeConfig;
    Logger.info(`Vite version ${version} | Preparing Vite runtime environment...`);
    process.chdir(projectRoot);
    
    const config: ResolvedMeteorViteConfig = await resolveConfig({
        ...inlineConfig,
        base: '/vite',
        appType: 'custom',
        server: { middlewareMode: true, },
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
    }, command);
    
    return {
        config,
    }
}