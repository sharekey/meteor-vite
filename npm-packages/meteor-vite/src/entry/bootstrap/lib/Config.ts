import FS from 'fs';
import Path from 'path';
import {
    type BuildEnvironmentOptions,
    createRunnableDevEnvironment,
    type InlineConfig,
    resolveConfig,
} from 'vite';
import { MeteorViteError } from '../../../error/MeteorViteError';
import { meteorWorker } from '../../plugin/Meteor';
import { type ProjectJson, type ResolvedMeteorViteConfig } from '../../plugin/Settings';
import Instance from './Instance';
import { serverRollupInput } from '../scripts/Setup';

export const CurrentConfig = globalThis.MeteorViteRuntimeConfig;

export async function resolveMeteorViteConfig(
    inlineConfig: InlineConfig,
    command: 'build' | 'serve',
) {
    Instance.printWelcomeMessage();
    Instance.logger.info('Resolving Vite config...');
    
    const { projectRoot, outDir } = CurrentConfig;
    const packageJson = parsePackageJson();
    process.chdir(projectRoot);
    const userConfig: ResolvedMeteorViteConfig = await resolveConfig(Object.assign({
        configFile: packageJson.meteor.vite?.configFile,
    }, inlineConfig), command);
    let serverBuildConfig: BuildEnvironmentOptions | undefined = undefined;
    
    if (userConfig.meteor?.serverEntry) {
        serverBuildConfig = {
            target: 'node20',
            manifest: false,
            ssrManifest: false,
            minify: false,
            sourcemap: true,
            rollupOptions: {
                input: {
                    main: serverRollupInput({
                        meteorMainModule: packageJson.meteor.mainModule.server,
                        viteServerEntry: userConfig.meteor.serverEntry,
                    }),
                },
                output: {
                    // Unfortunately Meteor still doesn't support
                    // ESM within the final server bundle.
                    format: 'cjs',
                    ...fileNameTemplates('server'),
                }
            },
        }
    }
    
    if (!userConfig.meteor?.clientEntry) {
        throw new MeteorViteError('Cannot build application. You need to specify a clientEntry in your Vite config!');
    }
    
    function fileNameTemplates(env: 'server' | 'client') {
        const template = {
            assetFileNames: `assets/[name]-[hash][extname]`,
            chunkFileNames: `chunk/[name]-[hash].js`,
            entryFileNames: `entry-${env}/[name].entry.js`,
        }
        
        if (env === 'server') {
            template.assetFileNames.replace('[name]', 'server/[name]');
            template.chunkFileNames.replace('[name]', 'server/[name]');
            template.entryFileNames.replace('entry-server', 'entry/server');
        }
        
        return template;
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
        build: {
            outDir,
            emptyOutDir: false,
            ssrManifest: `ssr.manifest.json`,
            manifest: `client.manifest.json`,
            rollupOptions: {
                output: fileNameTemplates('client'),
            }
        },
        environments: {
            server: {
                dev: {
                    createEnvironment(name, config) {
                        return createRunnableDevEnvironment(name, config);
                    }
                },
                resolve: {
                    external: true,
                    noExternal: ['meteor-vite']
                },
                build: serverBuildConfig,
            },
            client: {
                build: {
                    rollupOptions: {
                        input: {
                            main: userConfig.meteor.clientEntry,
                        },
                    }
                }
            }
        },
    } satisfies InlineConfig & Pick<ResolvedMeteorViteConfig, 'meteor'>;
    
    return {
        config,
        packageJson,
        outDir,
    }
}

function parsePackageJson(): ProjectJson {
    const { projectRoot } = CurrentConfig;
    const path = Path.join(projectRoot, 'package.json');
    
    if (!FS.existsSync(path)) {
        throw new Error(`⚡ Could not resolve package.json for your project: ${projectRoot}`);
    }
    
    return JSON.parse(FS.readFileSync(path, 'utf8'));
}