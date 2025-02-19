import Path from 'path';
import pc from 'picocolors';
import type { Plugin, PluginOption, ResolvedConfig, UserConfig } from 'vite';
import PackageJSON from '../../../package.json';
import { FatalMeteorViteError } from '../../error/MeteorViteError';
import type { PartialPluginOptions, PluginOptions, PluginSettings } from './Settings';
import { MeteorStubs } from './MeteorStubs';
import { mergeWithTypes, parseConfig } from './ParseConfig';

/**
 * Configure the Meteor-Vite compiler.
 * Will be added automatically by Meteor if omitted.
 *
 * Just make sure you set your {@link https://github.com/JorgenVatle/meteor-vite#installation clientEntry} either using
 * this plugin, or in your vite config.
 *
 * @example plugin (recommended)
 * export default defineConfig({
 *     plugins: [
 *         meteor({ clientEntry: './imports/entrypoint/vite.js' })
 *     ]
 * })
 *
 * @example vite config
 * export default defineConfig({
 *     meteor: {
 *         clientEntry: './imports/entrypoint/vite.js',
 *     }
 * })
 */
export default function meteor(config: PluginOptions): PluginOption {
    return meteorWorker(config);
}

/**
 * Internal worker plugin. Merges the user's config with necessary overrides for the Meteor compiler and loads the
 * MeteorStubs plugin.
 */
export function meteorWorker(config: PartialPluginOptions): PluginOption {
    const METEOR_LOCAL_DIR = process.env.METEOR_LOCAL_DIR || Path.join('.meteor', 'local');
    let enforce: 'pre' | undefined;
    let resolveId: Plugin['resolveId'];
    
    if (config.externalizeNpmPackages) {
        enforce = 'pre';
        resolveId = function resolveId(id) {
            const [module, ...path] = id.split('/');
            const match = config.externalizeNpmPackages?.find((name) => {
                if (!name) return false;
                if (module !== name) return false;
                return true;
            });
            if (!match) {
                return;
            }
            return `\0meteor:${id}`;
        }
    }
    
    return [
        {
            name: 'meteor-vite:config',
            enforce,
            resolveId,
            config: (userConfig) =>  {
                const pluginSettings = mergeMeteorSettings(userConfig, {
                    _configSource: 'plugin',
                    meteorStubs: {
                        packageJsonPath: 'package.json',
                        meteor: {
                            /**
                             * Client package cache
                             * @deprecated Use {@link buildProgramsPath} instead
                             */
                            packagePath: Path.join(METEOR_LOCAL_DIR, 'build', 'programs', 'web.browser', 'packages'),
                            
                            buildProgramsPath: Path.join(METEOR_LOCAL_DIR, 'build', 'programs'),
                            isopackPath: Path.join(METEOR_LOCAL_DIR, 'isopacks'),
                        },
                        debug: !!process.env.METEOR_VITE_STUBS_DEBUG,
                    },
                    tempDir: Path.join(METEOR_LOCAL_DIR, 'vite'),
                    assetsDir: 'vite',
                    stubValidation: {
                        warnOnly: process.env.NODE_ENV === 'production',
                        disabled: false,
                        ignorePackages: [
                            // These packages have exports that are intentionally left as undefined
                            // Causing false-positive validation warnings.
                            // https://github.com/JorgenVatle/meteor-vite/issues/246
                            'roles',
                            'alanning:roles'
                        ]
                    }
                }, config);
                
                const mergedUserConfig = mergeViteSettings(userConfig, {
                    base: pluginSettings.assetsBaseUrl ?? userConfig.base ?? '/vite',
                    define: {
                        __VITE_ASSETS_DIR__: JSON.stringify(pluginSettings.assetsDir),
                    },
                    optimizeDeps: {
                        entries: [pluginSettings.clientEntry]
                    }
                });
                
                userConfig.base = mergedUserConfig.base;
                userConfig.define = mergedUserConfig.define;
                userConfig.optimizeDeps = mergedUserConfig.optimizeDeps;
            },
            configResolved(resolvedConfig) {
                const config = parseConfig(resolvedConfig);
                if (!config.meteor) {
                    throw new FatalMeteorViteError(
                        `Could not retrieve Meteor-Vite settings! Did you forget to add ${pc.yellow('meteor-vite')} to your Vite config?`,
                        {
                            subtitle: `See the following link for a setup guide ${PackageJSON.homepage}`
                        }
                    )
                }
                
                if (!config.meteor.clientEntry) {
                    throw new FatalMeteorViteError(`You need to specify an entrypoint for Vite!`, {
                        subtitle: `More info available here ${PackageJSON.homepage}`
                    })
                }
            }
        },
        MeteorStubs(),
    ]
}

function mergeMeteorSettings(
    userConfig: ResolvedConfig | UserConfig,
    defaults: PartialPluginOptions,
    overrides: PartialPluginOptions
) {
    const viteConfig = parseConfig(userConfig);
    const existingSettings = viteConfig.meteor || {};
    const withDefaults = mergeWithTypes(defaults, existingSettings);
    return viteConfig.meteor = mergeWithTypes(withDefaults, overrides) as PluginSettings;
}

function mergeViteSettings(
    userConfig: ResolvedConfig | UserConfig,
    defaults: UserConfig,
) {
    const viteConfig = parseConfig(userConfig);
    return mergeWithTypes(defaults, viteConfig);
}
