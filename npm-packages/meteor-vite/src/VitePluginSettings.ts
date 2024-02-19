import { OutputOptions } from 'rollup';
import { ResolvedConfig } from 'vite';
import { DeepPartial, MakeOptional } from './utilities/GenericTypes';

export type PluginOptions = MakeOptional<PluginSettings, 'stubValidation' | 'meteorStubs' | 'tempDir'>;
export type PartialPluginOptions = DeepPartial<PluginSettings>;

export interface MeteorStubsSettings {
    
    meteor: {
        /**
         * Path to Meteor's internal package cache.
         * This can change independently of the isopack path depending on whether we're building for production or
         * serving up the dev server.
         *
         * @example {@link /examples/vue/.meteor/local/build/programs/web.browser/packages}
         */
        packagePath: string;
        
        /**
         * Path to Meteor's local Isopacks store. Used to determine where a package's mainModule is located and whether
         * the package has lazy-loaded modules. During production builds this would be pulled from a temporary
         * Meteor build, so that we have solid metadata to use when creating Meteor package stubs.
         *
         * @example {@link /examples/vue/.meteor/local/isopacks/}
         */
        isopackPath: string;
        
        /**
         * Path to the current user's Meteor package cache. (e.g. /home/john/.meteor/packages)
         * This is used to build up a fallback path for isopack manifests.
         *
         * Some packages, like `react-meteor-data` do not emit a isopack metadata file within the current project's
         * .meteor/local directory. So we have to resort to pulling in Isopack metadata from the `meteor-tool` cache.
         *
         * @example `react-meteor-data` path
         * /home/john/.meteor/packages/react-meteor-data/2.7.2/web.browser.json
         */
        globalMeteorPackagesDir?: string;
    };
    
    /**
     * Full content of the user's Meteor project package.json.
     * Like the one found in {@link /examples/vue/package.json}
     */
    packageJson?: ProjectJson;
    
    /**
     * Alternatively, a path to a package.json file can be supplied.
     */
    packageJsonPath?: string;
    
    /**
     * Enabling debug mode will write all input and output files to a `.meteor-vite` directory in the Meteor project's
     * root. Handy for quickly assessing how things are being formatted, or for use in writing up new test cases for
     * meteor-vite.
     */
    debug?: boolean;
    
}

export interface PluginSettings {
    /**
     * Vite client entry into Meteor.
     * Not to be confused with your Meteor mainModule.
     *
     * {@link https://github.com/JorgenVatle/meteor-vite#readme}
     */
    clientEntry: string;
    
    /**
     * Skips bundling the provided npm packages if they are already provided by Meteor.
     */
    externalizeNpmPackages: string[];
    
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
    chunkFileNames?: OutputOptions['chunkFileNames'];
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

/**
 * The user's Meteor project package.json content.
 * todo: expand types
 */
export type ProjectJson = {
    name: string;
    dependencies: {
        'meteor-vite'?: string;
    }
    devDependencies: {
        'meteor-vite'?: string;
    }
    meteor: {
        mainModule: {
            client: string;
        },
        /**
         * @deprecated Use meteor.vite.configFile instead.
         * See {@link https://github.com/JorgenVatle/meteor-vite?tab=readme-ov-file#configuration configuration} for
         * example.
         */
        viteConfig?: string;
        vite?: {
            /**
             * Specifies an alternative path to the project's Vite config
             */
            configFile?: string;
            
            /**
             * Remove or replace Meteor packages when preparing the intermediary production build.
             * Does not affect your final production bundle. It's only used as a temporary build step.
             */
            replacePackages?: {
                startsWith: string; // Match any Meteor package name that starts with the provided string.
                replaceWith: string; // Replace matching packages with the provided string.
            }[];
            
            /**
             * Override the directory path used for preparing the Vite production bundle.
             * Might be useful if the automatically generated file path is inaccessible in your operating system
             */
            tempBuildDir?: string;
        }
    }
}

/**
 * A resolved Vite config, after our workers has merged it with default settings and overrides from the Meteor instance.
 */
export declare interface ResolvedMeteorViteConfig extends ResolvedConfig {
    meteor?: PluginSettings;
}

