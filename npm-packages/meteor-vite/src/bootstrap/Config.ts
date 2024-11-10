import FS from 'fs';
import Path from 'path';
import pc from 'picocolors';
import {
    type BuildEnvironmentOptions,
    createNodeDevEnvironment,
    createServerHotChannel,
    type InlineConfig,
    resolveConfig,
    version,
} from 'vite';
import { CurrentConfig } from '../../../../packages/vite/src/util/CurrentConfig';
import { meteorWorker } from '../plugin/Meteor';
import Logger, { BuildLogger } from '../utilities/Logger';
import { type ResolvedMeteorViteConfig } from '../VitePluginSettings';

export async function resolveMeteorViteConfig(
    inlineConfig: InlineConfig,
    command: 'build' | 'serve',
) {
    const { packageJson, projectRoot } = globalThis.MeteorViteRuntimeConfig;
    BuildLogger.info(pc.green(`Vite version ${pc.cyan(version)} | Initializing Vite Dev Server...`));
    process.chdir(projectRoot);
    const userConfig: ResolvedMeteorViteConfig = await resolveConfig(inlineConfig, command);
    let serverBuildConfig: BuildEnvironmentOptions | undefined = undefined;
    
    prepareServerEntry();
    
    if (userConfig.meteor?.serverEntry) {
        serverBuildConfig = {
            outDir: Path.join(CurrentConfig.tempDir, 'build', 'server'),
            rollupOptions: {
                input: userConfig.meteor.serverEntry,
            }
        }
    }
    
    const { bundleFileExtension: ext } = CurrentConfig;
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
            rollupOptions: {
                output: {
                    assetFileNames: `assets/[name]-[hash][extname]${ext}`,
                    chunkFileNames: `chunk/[name]-[hash].js${ext}`,
                    entryFileNames: `entry/[name]-[hash].js${ext}`
                }
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
                    outDir: Path.join(CurrentConfig.tempDir, 'build', 'client'),
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

/**
 * Create an empty entry module that can imported by Meteor's mainModule configured in package.json.
 */
function prepareServerEntry() {
    FS.mkdirSync(CurrentConfig.serverEntryModule, { recursive: true });
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
function injectServerEntryImport() {
    const mainModule = CurrentConfig.serverMainModule;
    const originalContent = FS.readFileSync(mainModule, 'utf-8');
    const importPath = Path.relative(mainModule, CurrentConfig.serverEntryModule);
    
    if (originalContent.includes(importPath)) {
        return;
    }
    
    FS.writeFileSync(mainModule, [`import ${JSON.parse(importPath)}`, originalContent].join('\n'));
}