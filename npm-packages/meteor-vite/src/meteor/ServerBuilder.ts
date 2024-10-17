import FS from 'fs/promises';
import Path from 'path';
import { build, resolveConfig } from 'vite';
import { MeteorViteError } from '../error/MeteorViteError';
import Logger from '../utilities/Logger';
import { ResolvedMeteorViteConfig } from '../VitePluginSettings';
import type { DevServerOptions } from './IPC/methods/vite-server';

const BUNDLE_OUT = {
    dir: 'server/bundle',
    filename: 'meteor.server',
}

export async function MeteorServerBuilder({ packageJson }: Pick<DevServerOptions, 'packageJson'>) {
    const viteConfig: ResolvedMeteorViteConfig = await resolveConfig({
        configFile: packageJson?.meteor?.vite?.configFile
            // Fallback for deprecated config format
            ?? packageJson?.meteor?.viteConfig,
    }, 'serve');
    
    if (!viteConfig.meteor?.serverEntry) {
        return;
    }
    
    if (!packageJson.meteor.mainModule.server) {
        throw new MeteorViteError('You need to specify a Meteor server mainModule in your package.json file!')
    }
    
    await prepareServerEntry({
        meteorMainModule: Path.resolve(packageJson.meteor.mainModule.server),
        viteServerBundle: Path.resolve(
            Path.join(BUNDLE_OUT.dir, BUNDLE_OUT.filename)
        ),
    })
    
    build({
        mode: 'meteor-server:development',
        configFile: viteConfig.configFile,
        build: {
            watch: {},
            lib: {
                entry: viteConfig.meteor.serverEntry,
                name: 'meteor-server',
                fileName: BUNDLE_OUT.filename,
                formats: ['es'],
            },
            sourcemap: true,
            outDir: BUNDLE_OUT.dir,
            minify: false,
            rollupOptions: {
                external: (id) => {
                    if (id.startsWith('meteor')) {
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
    
    // Add import for Vite bundle to server mainModule
    {
        const importString = `import(${JSON.stringify('./' + relativeViteModulePath)}).catch((e) => console.warn('Failed to load Vite server bundle. If this is the first time starting the server, you can safely ignore this error.', e))`;
        
        if (mainModuleContent.includes(importString)) {
            return;
        }
        
        Logger.info(`Added explicit import for Meteor-Vite server bundle to ${relativeViteModulePath}`);
        const newMainModuleContent = `${importString}\n${mainModuleContent}`;
        await FS.writeFile(paths.meteorMainModule, newMainModuleContent);
    }
    
}
