import type { InputFile } from 'meteor/isobuild';
import { Plugin } from 'meteor/isobuild';
import FS from 'node:fs';
import Path from 'path';
import pc from 'picocolors';
import { inspect } from 'util';
import type { BuildPluginFile } from 'vite-bundler/src/plugin/Compiler';
import { runBootstrapScript } from './util/Bootstrap';
import { CurrentConfig } from './util/CurrentConfig';
import Logger from './util/Logger';

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
    
    protected _sourcemap(file: BuildPluginFile) {
        const filename = this._formatFilename(file.getPathInPackage()) + `.map`;
        const path = Path.resolve(CurrentConfig.projectRoot, filename);
        if (!FS.existsSync(path)) {
            Logger.warn(`Could not resolve source map for ${pc.green(filename)}`);
            return;
        }
        return FS.readFileSync(path, 'utf8')
    }
}

// Cleanup temporary files from previous builds.
await runBootstrapScript('setupProject');

if (CurrentConfig.mode === 'production') {
    try {
        const bundle = runBootstrapScript('buildForProduction').catch((error) => {
            if (CurrentConfig.productionPreview) {
                return { outDir: CurrentConfig.outDir };
            }
            throw error;
        });
        Plugin.registerCompiler({
            filenames: [],
            extensions: [CurrentConfig.bundleFileExtension]
        }, () => bundle.then((({ outDir }) => new CompilerPlugin({ outDir }))));
    } catch (error) {
        Logger.error('build failed');
        console.error(error);
        throw error;
    }
}