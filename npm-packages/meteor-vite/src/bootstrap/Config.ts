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
    const { meteor }: ResolvedMeteorViteConfig = await resolveConfig(inlineConfig, command);
    const tempDir = meteor?.tempDir || '_vite-bundle';
    let buildEnvironment: BuildEnvironmentOptions | undefined = undefined;
    
    if (meteor?.serverEntry) {
        buildEnvironment = {
            outDir: Path.join(tempDir, 'build', 'server'),
            rollupOptions: {
                input: meteor.serverEntry,
            }
        }
    }
    
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
        build: {
            outDir: Path.join(tempDir, 'build', 'client'),
        },
        environments: {
            node: {
                dev: {
                    createEnvironment(name, config) {
                        return createNodeDevEnvironment(name, config, {
                            hot: createServerHotChannel(),
                        })
                    }
                },
                build: buildEnvironment,
            },
        },
        builder: {
            buildApp: async (builder) => {
                const builds = Object.entries(builder.environments).map(([name, environment]) => {
                    Logger.info(`Building app: ${name}`);
                    return builder.build(environment)
                });
                await Promise.all(builds);
            }
        }
    }, command);
    
    return {
        config,
    }
}