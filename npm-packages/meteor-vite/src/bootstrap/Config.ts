import FS from 'fs';
import Path from 'path';
import pc from 'picocolors';
import {
    type BuildEnvironmentOptions,
    createNodeDevEnvironment,
    createServerHotChannel,
    type InlineConfig,
    resolveConfig,
} from 'vite';
import { CurrentConfig } from '../../../../packages/vite/src/util/CurrentConfig';
import { MeteorViteError } from '../error/MeteorViteError';
import { meteorWorker } from '../plugin/Meteor';
import { homepage } from '../utilities/Constants';
import Logger from '../utilities/Logger';
import { type ProjectJson, type ResolvedMeteorViteConfig } from '../VitePluginSettings';
import Instance from './Instance';

export async function resolveMeteorViteConfig(
    inlineConfig: InlineConfig,
    command: 'build' | 'serve',
) {
    Instance.printWelcomeMessage();
    Instance.logger.info('Resolving Vite config...');
    
    const { projectRoot } = globalThis.MeteorViteRuntimeConfig;
    const packageJson = parsePackageJson();
    process.chdir(projectRoot);
    const userConfig: ResolvedMeteorViteConfig = await resolveConfig(inlineConfig, command);
    let serverBuildConfig: BuildEnvironmentOptions | undefined = undefined;
    const outDir = Path.join(CurrentConfig.tempDir, 'dist');
    
    prepareServerEntry();
    
    if (userConfig.meteor?.serverEntry) {
        injectServerEntryImport(packageJson.meteor.mainModule.server);
        serverBuildConfig = {
            target: 'node20',
            manifest: false,
            ssrManifest: false,
            minify: false,
            sourcemap: true,
            rollupOptions: {
                input: {
                    main: prepareProductionServerProxyModule(userConfig.meteor.serverEntry),
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
                        return createNodeDevEnvironment(name, config, {
                            hot: createServerHotChannel(),
                        })
                    }
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

/**
 * Create an empty entry module that can imported by Meteor's mainModule configured in package.json.
 */
function prepareServerEntry() {
    FS.mkdirSync(Path.dirname(CurrentConfig.serverEntryModule), { recursive: true });
    FS.writeFileSync(
        Path.join(
            Path.dirname(CurrentConfig.serverEntryModule),
            '.gitignore'
        ),
        '*'
    );
    FS.writeFileSync(CurrentConfig.serverEntryModule, '// Dynamic entrypoint for the Meteor server. Imports are added here during builds');
}

/**
 * Add an import for the Vite-built server entry module to Meteor's configured mainModule.
 * This ensures that assets built by Vite will actually be loaded by the Meteor server after
 * creating a production build. Otherwise, the files emitted by Vite will be ignored by the
 * Meteor server.
 */
function injectServerEntryImport(mainModule: string | undefined) {
    if (!mainModule) {
        throw new MeteorViteError('Could not find a server mainModule path in your package.json!', {
            subtitle: `Visit ${pc.blue(homepage)} for more details`
        })
    }
    
    const originalContent = FS.readFileSync(mainModule, 'utf-8');
    const importPath = Path.relative(Path.dirname(mainModule), CurrentConfig.serverEntryModule);
    
    if (originalContent.includes(importPath)) {
        return;
    }
    
    Logger.warn(`Meteor-Vite needs to write to the Meteor main module defined in your package.json`);
    Logger.warn(`If you've migrated an existing project, please make sure to move any existing code in this file over to the entry module specified in your Vite config.`);
    
    
    FS.writeFileSync(mainModule, [
        `/**`,
        ` * These modules are automatically imported by jorgenvatle:vite-bundler.`,
        ` * You can commit these to your project or move them elsewhere if you'd like,`,
        ` * but they must be imported somewhere in your Meteor mainModule.`,
        ` *`,
        ` * More info: https://github.com/JorgenVatle/meteor-vite#lazy-loaded-meteor-packages`,
        ` **/`,
        `import ${JSON.stringify(importPath)}`,
        '/** End of vite-bundler auto-imports **/',
        originalContent,
    ].join('\n'));
}

function prepareProductionServerProxyModule(serverEntry: string) {
    FS.writeFileSync(CurrentConfig.serverProductionProxyModule, [
        `import "meteor-vite/bootstrap/ProductionEnvironment"`,
        `import ${JSON.stringify(Path.resolve(CurrentConfig.projectRoot, serverEntry))}`,
    ].join('\n'));
    return CurrentConfig.serverProductionProxyModule;
}

function parsePackageJson(): ProjectJson {
    const { projectRoot } = CurrentConfig;
    const path = Path.join(projectRoot, 'package.json');
    
    if (!FS.existsSync(path)) {
        throw new Error(`⚡ Could not resolve package.json for your project: ${projectRoot}`);
    }
    
    return JSON.parse(FS.readFileSync(path, 'utf8'));
}