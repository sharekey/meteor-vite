import FS from 'fs/promises';
import Path from 'path';
import { resolveConfig, build as viteBuild } from 'vite';
import { build } from 'tsup';
import { MeteorViteError } from '../error/MeteorViteError';
import Logger from '../utilities/Logger';
import { type ProjectJson, ResolvedMeteorViteConfig } from '../VitePluginSettings';

const BUNDLE_OUT_DIR = Path.join('_vite-bundle', 'server');

export async function MeteorServerBuilder({ packageJson, watch = true }: { packageJson: ProjectJson, watch?: boolean }) {
    const viteConfig: ResolvedMeteorViteConfig = await resolveConfig({
        configFile: packageJson?.meteor?.vite?.configFile
            // Fallback for deprecated config format
            ?? packageJson?.meteor?.viteConfig,
    }, 'build');
    
    if (!viteConfig.meteor?.serverEntry) {
        return;
    }
    
    Logger.warn(
        'Meteor Server bundling with Vite is enabled. This is an experimental feature that will attempt to bundle' +
        ' your Meteor server using Vite.',
    )
    
    if (!viteConfig.meteor?.enableExperimentalFeatures) {
        Logger.warn(
            'To enable server bundling, you need to set "enableExperimentalFeatures" to true in your Vite' +
            ' config. To disable these warnings, just remove the "serverEntry" field in your Vite config.'
        )
        return;
    }
    
    if (!packageJson.meteor.mainModule.server) {
        throw new MeteorViteError('You need to specify a Meteor server mainModule in your package.json file!')
    }
    
    const noExternal: (string | RegExp)[] = [];
    
    if (Array.isArray(viteConfig.ssr.noExternal)) {
        viteConfig.ssr.noExternal.forEach((entry) => {
            if (!entry) return;
            noExternal.push(entry);
        });
    }
    
    await build({
        watch,
        entry: [viteConfig.meteor.serverEntry],
        sourcemap: true,
        skipNodeModulesBundle: true,
        minify: false,
        clean: false,
        target: 'es2022',
        outDir: BUNDLE_OUT_DIR,
        noExternal,
        esbuildPlugins: [
            {
                name: 'vue',
                async setup(build) {
                    // Todo: Only run Vite build if ESBuild tries to load module without a supported content type.
                    //  E.g. Vue or Svelte components.
                    const output = await viteBuild({
                        configFile: viteConfig.configFile,
                        mode: 'production',
                        build: {
                            ssr: viteConfig.meteor?.serverEntry,
                            ssrEmitAssets: false,
                            write: false,
                            rollupOptions: {
                                external: (id) => id.startsWith('meteor'),
                            },
                        }
                    });
                    
                    if (!('output' in output)) {
                        throw Error('no output');
                    }
                    const mainChunk = output.output[0];
                    
                    function matchesModulePath(paths: { vite: string, esbuild: string }) {
                        const esbuildImport = Path.relative('', Path.join(process.cwd(), paths.esbuild));
                        const viteImport = Path.relative(process.cwd(), paths.vite.replace(/\?.*/, ''));
                        
                        console.log({ esbuildImport, viteImport });
                        return esbuildImport === viteImport;
                    }
                    
                    
                    build.onResolve({ filter: /\.vue$/ }, (args) => {
                        console.log({ args });
                        return {
                            path: args.path,
                            namespace: 'vue',
                        }
                    });
                    
                    build.onLoad({ filter: /.*/, namespace: 'vue' }, (args) => {
                        for (const [vitePath, module] of Object.entries(mainChunk.modules)) {
                            if (matchesModulePath({ vite: vitePath, esbuild: args.path })) {
                                return {
                                    contents: module.code || '',
                                    loader: 'js',
                                }
                            }
                        }
                        return {
                            loader: 'empty',
                            contents: '',
                        }
                    })

                    console.dir({ mainChunk }, { depth: 5 });
                },
            },
            {
                name: 'external-meteor',
                setup(build) {
                    build.onResolve({ filter: /^meteor\// }, (args) => ({
                        path: args.path,
                        namespace: 'meteor',
                        external: true,
                    }));
                }
            }
        ]
    });
    
    const { name } = Path.parse(viteConfig.meteor.serverEntry);
    await prepareServerEntry({
        meteorMainModule: Path.resolve(packageJson.meteor.mainModule.server),
        staticEntryFile: Path.resolve(
            Path.join(BUNDLE_OUT_DIR, '__entry.js'),
        ),
        viteServerBundle: Path.resolve(
            Path.join(BUNDLE_OUT_DIR, name)
        ),
    })
}

async function prepareServerEntry(paths: {
    meteorMainModule: string;
    viteServerBundle: string;
    /**
     * Proxy module with a static filename which imports the final Vite build.
     * An import for this module is injected into the user's server mainModule.
     */
    staticEntryFile: string;
}) {
    const mainModuleContent = await FS.readFile(paths.meteorMainModule, 'utf8');
    
    // Add .gitignore to build output
    {
        const gitignorePath = Path.join(Path.dirname(paths.viteServerBundle), '.gitignore');
        await FS.mkdir(Path.dirname(paths.viteServerBundle), { recursive: true });
        await FS.writeFile(gitignorePath, '*');
    }
    
    // Create entry module for the Server bundle.
    // Since Vite SSR build filenames aren't static, it's important we have one file that has a static filename
    // which we can add as a one-off import to the Meteor mainModule controlled by the user.
    {
        const relativeViteServerModulePath = Path.relative(
            Path.dirname(paths.staticEntryFile),
            paths.viteServerBundle,
        )
        const importString = `import ${JSON.stringify('./' + relativeViteServerModulePath)};`;
        await FS.writeFile(paths.staticEntryFile, importString);
    }
    
    // Modify Meteor Server mainModule with an import for the Vite bundle.
    {
        const bundleEntryPath = Path.relative(
            Path.dirname(paths.meteorMainModule),
            paths.staticEntryFile
        )
        
        const errorMessage = JSON.stringify(
            `\nFailed to import Meteor Server bundle from Vite!`,
        )
        
        const importString = [
            `import(${JSON.stringify('./' + bundleEntryPath)})`,
            `.catch((e) => {`,
                `console.warn(${errorMessage});`,
                `console.error(e);`,
            `});`
        ];
        
        if (mainModuleContent.includes(bundleEntryPath[0])) {
            return;
        }
        
        Logger.info(`Added explicit import for Meteor-Vite server bundle to mainModule ${Path.relative(Path.resolve('.'), paths.meteorMainModule)}`);
        const newMainModuleContent = `${importString.join('')}\n${mainModuleContent}`;
        await FS.writeFile(paths.meteorMainModule, newMainModuleContent);
    }
    
}
