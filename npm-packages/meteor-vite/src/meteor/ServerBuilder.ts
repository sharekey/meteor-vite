import FS from 'fs/promises';
import Path from 'path';
import { build, mergeConfig, resolveConfig } from 'vite';
import { MeteorViteError } from '../error/MeteorViteError';
import Logger from '../utilities/Logger';
import { type ProjectJson, ResolvedMeteorViteConfig } from '../VitePluginSettings';

const BUNDLE_OUT_DIR = Path.join('_vite', 'server');

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
    
    build({
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
    }).catch((error) => {
        Logger.error('Encountered error while preparing server build!', error);
    }).then(() => {
        Logger.info('Server build completed!');
    });
    
    const { name } = Path.parse(viteConfig.meteor.serverEntry);
    await prepareServerEntry({
        meteorMainModule: Path.resolve(packageJson.meteor.mainModule.server),
        viteServerBundle: Path.resolve(
            Path.join(BUNDLE_OUT_DIR, name)
        ),
    })
}

async function prepareServerEntry(paths: {
    meteorMainModule: string;
    viteServerBundle: string;
}) {
    const mainModuleContent = await FS.readFile(paths.meteorMainModule, 'utf8');
    const relativeViteModulePath = Path.relative(
        Path.dirname(paths.meteorMainModule),
        paths.viteServerBundle,
    );
    
    // Add .gitignore to build output
    {
        const gitignorePath = Path.join(Path.dirname(paths.viteServerBundle), '.gitignore');
        await FS.mkdir(Path.dirname(paths.viteServerBundle), { recursive: true });
        await FS.writeFile(gitignorePath, '*');
    }
    
    // Modify Meteor Server mainModule with an import for the Vite bundle.
    {
        const errorMessage = JSON.stringify(
            `Failed to import Meteor Server bundle from Vite! This may sometimes happen if it's your first time starting the app.`,
        )
        
        const importString = `import(${JSON.stringify('./' + relativeViteModulePath)}).catch((e) => console.warn(${errorMessage}, e));`;
        
        if (mainModuleContent.includes(importString)) {
            return;
        }
        
        Logger.info(`Added explicit import for Meteor-Vite server bundle to ${relativeViteModulePath}`);
        const newMainModuleContent = `${importString}\n${mainModuleContent}`;
        await FS.writeFile(paths.meteorMainModule, newMainModuleContent);
    }
    
}
