import Path from 'path';
import pc from 'picocolors';
import { OutputOptions } from 'rollup';
import { PluginOption, ResolvedConfig, UserConfig } from 'vite';
import PackageJSON from '../../package.json';
import { FatalMeteorViteError } from '../error/MeteorViteError';
import { DeepPartial, MakeOptional } from '../utilities/GenericTypes';
import { MeteorStubs, MeteorStubsSettings } from './MeteorStubs';
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
export default function meteor(config: PluginOptions) {
    return meteorWorker(config);
}

/**
 * Internal worker plugin. Merges the user's config with necessary overrides for the Meteor compiler and loads the
 * MeteorStubs plugin.
 */
export function meteorWorker(config: PartialPluginOptions): PluginOption {
    return [
        {
            name: 'meteor-vite:config',
            config: (userConfig) =>  {
                mergeMeteorSettings(userConfig, {
                    meteorStubs: {
                        packageJsonPath: 'package.json',
                        meteor: {
                            packagePath: Path.join('.meteor', 'local', 'build', 'programs', 'web.browser', 'packages'),
                            isopackPath: Path.join('.meteor', 'local', 'isopacks'),
                        }
                    },
                    tempDir: Path.join('.meteor', 'local', 'vite'),
                    stubValidation: {
                        warnOnly: process.env.NODE_ENV === 'production',
                        disabled: false,
                    }
                }, config);
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

type PluginOptions = MakeOptional<PluginSettings, 'stubValidation' | 'meteorStubs' | 'tempDir'>;
export type PartialPluginOptions = DeepPartial<PluginSettings>;

export interface PluginSettings {
    /**
     * Vite client entry into Meteor.
     * Not to be confused with your Meteor mainModule.
     *
     * {@link https://github.com/JorgenVatle/meteor-vite#readme}
     */
    clientEntry: string;
    
    /**
     * Override the destination directory for the intermediary Vite bundle - before the bundle is passed through
     * its final stage through the Meteor bundler.
     */
    tempDir: string;
    
    /**
     * Settings for controlling how stubs created by Meteor-Vite are validated.
     * These settings only apply in a development environment. Once the app is bundled for production, runtime
     * stub validation is disabled.
     */
    stubValidation: StubValidationSettings;
    
    /**
     * Internal configuration injected by the vite:bundler Meteor package. Specifies some important source paths
     * needed to assist Vite in building your Meteor project.
     *
     * If you know what you're doing, you could use this alongside the Internal.MeteorStubs plugin to build your project
     * using Vite independently of Meteor. Or to host the Vite dev server yourself instead of letting the vite:bundler
     * plugin do the work for you.
     */
    meteorStubs: MeteorStubsSettings;
    
    /**
     * Customize the chunk file name format for Rollup builds.
     * Filename uniqueness is important as duplicate filenames for server and client modules may prevent your other
     * build plugins from handling server code, leading to unstable server builds.
     *
     * Important: Filenames are not scoped by directory. So the chunk filenames need to be unique across the entirety
     * of your project.
     *
     * Only change this if you are sure you know what you're doing.
     */
    chunkFileNames?: OutputOptions['chunkFileNames']
}

export interface StubValidationSettings {
    /**
     * list of packages to ignore export validation for.
     * @example
     * { ignorePackages: ['ostrio:cookies', 'test:ts-modules', ...] }
     */
    ignorePackages?: string[];
    
    /**
     * Will only emit warnings in the console instead of throwing an exception that may prevent the client app
     * from loading.
     * @default true
     */
    warnOnly?: boolean;
    
    /**
     * Whether to completely disable stub validation feature for Meteor-Vite.
     *
     * Tip:
     * You can use a conditional Vite configuration to enable/disable this for your production build
     * {@link https://vitejs.dev/config/#conditional-config}
     *
     * @default false
     */
    disabled?: boolean;
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