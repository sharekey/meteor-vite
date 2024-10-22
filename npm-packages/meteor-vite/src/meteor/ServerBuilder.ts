import FS from 'fs/promises';
import Path from 'path';
import { build, resolveConfig } from 'vite';
import { MeteorViteError } from '../error/MeteorViteError';
import Logger from '../utilities/Logger';
import { type ProjectJson, ResolvedMeteorViteConfig } from '../VitePluginSettings';

const BUNDLE_OUT_DIR = Path.join('_vite-bundle', 'server');

export async function MeteorServerBuilder({ packageJson, watch = true }: { packageJson: ProjectJson, watch?: boolean }) {
    const viteConfig: ResolvedMeteorViteConfig = await resolveConfig({
        configFile: packageJson?.meteor?.vite?.configFile
            // Fallback for deprecated config format
            ?? packageJson?.meteor?.viteConfig,
    }, 'serve');
    
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
    
    await build({
        mode: watch ? 'development' : 'production',
        configFile: viteConfig.configFile,
        ssr: {
            target: 'node',
        },
        build: {
            watch: watch ? {} : null,
            ssr: viteConfig.meteor.serverEntry,
            outDir: BUNDLE_OUT_DIR,
            minify: false,
            sourcemap: true,
            emptyOutDir: false,
            rollupOptions: {
                external: (id) => {
                    if (id.startsWith('meteor/')) {
                        return true;
                    }
                }
            }
        }
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
