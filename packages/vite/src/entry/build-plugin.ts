import type { InputFile } from 'meteor/isobuild';
import { Plugin } from 'meteor/isobuild';
import FS from 'node:fs';
import Path from 'path';
import pc from 'picocolors';
import { inspect } from 'util';
import { runBootstrapScript } from '../util/Bootstrap';
import { CurrentConfig } from '../util/CurrentConfig';
import Logger from '../util/Logger';

class CompilerPlugin {
    constructor(public readonly config: { outDir: string }) {
        Logger.info('Initializing Meteor Compiler Plugin...');
    }
    processFilesForTarget(files: InputFile[]) {
        files.forEach(file => {
            const fileMeta = {
                _original: {
                    basename: file.getBasename(),
                    path: file.getPathInPackage(),
                },
                basename: this._formatFilename(file.getBasename()),
                path: Path.join('vite', Path.relative(this.config.outDir, this._formatFilename(file.getPathInPackage()))),
                arch: file.getArch(),
            }
            
            Logger.debug(`[${pc.yellow(file.getArch())}] Processing: ${fileMeta.basename}`, pc.dim(inspect({ fileMeta }, { colors: true })));
            
            if (fileMeta.arch.startsWith('os') && fileMeta.basename.endsWith('.entry.js')) {
                file.addJavaScript({
                    path: fileMeta.path,
                    data: file.getContentsAsString(),
                    sourceMap: this._sourcemap(file),
                });
                Logger.debug(`Added ${pc.yellow('JavaScript')} to ${pc.cyan(fileMeta.arch)}: ${fileMeta.basename}`);
                return;
            }
            
            file.addAsset({
                path: fileMeta.path,
                data: file.getContentsAsBuffer(),
            });
        })
    }
    protected _formatFilename(nameOrPath: string) {
        return nameOrPath.replace(`.${CurrentConfig.bundleFileExtension}`, '');
    }
    
    protected _sourcemap(file: InputFile) {
        const filename = this._formatFilename(file.getPathInPackage()) + `.map`;
        const path = Path.resolve(CurrentConfig.projectRoot, filename);
        if (!FS.existsSync(path)) {
            Logger.warn(`Could not resolve source map for ${pc.green(filename)}`);
            return;
        }
        return FS.readFileSync(path, 'utf8')
    }
}

if (process.env.VITE_METEOR_DISABLED) {
    Logger.warn('MeteorVite build plugin disabled');
}

else {
    
    // Cleanup temporary files from previous builds.
    const cleanup = runBootstrapScript('setupProject');
   
    // todo: Verify Meteor packages file to warn users if there are active incompatible plugins.
    //  The standard-minifier plugins strip out sources that the export analyzer depends on, so
    //  with these plugins installed, builds will always fail.
    
    if (CurrentConfig.mode === 'production') {
        Plugin.registerCompiler({
            filenames: [],
            extensions: [CurrentConfig.bundleFileExtension]
        }, async () => {
            try {
                await cleanup;
                const { outDir } = await runBootstrapScript('buildForProduction').catch((error) => {
                    if (CurrentConfig.productionPreview) {
                        return { outDir: CurrentConfig.outDir };
                    }
                    throw error;
                });
                
                return new CompilerPlugin({ outDir });
            } catch (error) {
                Logger.error('build failed');
                console.error(error);
                throw error;
            }
        });
    }
    
   await cleanup;
}

