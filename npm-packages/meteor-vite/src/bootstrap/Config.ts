import Path from 'path';
import {
    type BuildEnvironmentOptions,
    createNodeDevEnvironment,
    createServerHotChannel,
    type InlineConfig,
    resolveConfig,
    version,
} from 'vite';
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
    const userConfig: ResolvedMeteorViteConfig = await resolveConfig(inlineConfig, command);
    const tempDir = userConfig.meteor?.tempDir || '_vite-bundle';
    let serverBuildConfig: BuildEnvironmentOptions | undefined = undefined;
    
    if (userConfig.meteor?.serverEntry) {
        serverBuildConfig = {
            outDir: Path.join(tempDir, 'build', 'server'),
            rollupOptions: {
                input: userConfig.meteor.serverEntry,
            }
        }
    }
    
    const config = {
        ...inlineConfig,
        meteor: userConfig.meteor,
        base: '/vite',
        appType: 'custom',
        server: { middlewareMode: true, },
        configFile: userConfig.configFile,
        plugins: [
            meteorWorker({
                meteorStubs: { packageJson }
            })
        ],
        environments: {
            server: {
                dev: {
                    createEnvironment(name, config) {
                        return createNodeDevEnvironment(name, config, {
                            hot: createServerHotChannel(),
                        })
                    }
                },
                build: serverBuildConfig,
            },
            client: {
                build: {
                    outDir: Path.join(tempDir, 'build', 'client'),
                    rollupOptions: {
                        input: userConfig.meteor?.clientEntry,
                    }
                }
            }
        },
    } satisfies InlineConfig & Pick<ResolvedMeteorViteConfig, 'meteor'>;
    
    return {
        config,
    }
}