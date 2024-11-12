import Path from 'path';
import pc from 'picocolors';
import type { BuildPluginFile } from '../../vite-bundler/src/plugin/Compiler';
import { runBootstrapScript } from './util/Bootstrap';
import { CurrentConfig } from './util/CurrentConfig';
import Logger from './util/Logger';

class CompilerPlugin {
    constructor(public readonly config: { distDir: string }) {
        Logger.info('Initializing Meteor Compiler Plugin...');
    }
    processFilesForTarget(files: BuildPluginFile[]) {
        files.forEach(file => {
            const fileMeta = {
                _original: {
                    basename: file.getBasename(),
                    path: file.getPathInPackage(),
                },
                basename: this._formatFilename(file.getBasename()),
                path: Path.relative(Path.join(Path.join(CurrentConfig.tempDir, 'build')), this._formatFilename(file.getPathInPackage())),
                arch: file.getArch(),
            }
            const sourcePath = file.getPathInPackage();
            
            Logger.debug(`[${pc.yellow(file.getArch())}] Processing: ${fileMeta.basename}`, { fileMeta });
            
            if (fileMeta.arch.startsWith('os') && fileMeta.basename.endsWith('js')) {
                file.addJavaScript({
                    path: fileMeta.path,
                    data: file.getContentsAsString(),
                });
                Logger.debug(`Added ${pc.yellow('JavaScript')} to ${pc.cyan(fileMeta.arch)}: ${fileMeta.basename}`);
                return;
            }
            
            file.addAsset({
                path: fileMeta.path,
                data: file.getContentsAsBuffer(),
                cacheable: true,
            });
            
            file.cacheable = true;
        })
    }
    protected _formatFilename(nameOrPath: string) {
        return nameOrPath.replace(`.${CurrentConfig.bundleFileExtension}`, '');
    }
}

if (CurrentConfig.mode === 'production') {
    try {
        const bundle = runBootstrapScript('buildForProduction');
        Plugin.registerCompiler({
            filenames: [],
            extensions: [CurrentConfig.bundleFileExtension]
        }, () => bundle.then((() => new CompilerPlugin({ distDir: '' }))));
    } catch (error) {
        Logger.error('build failed');
        console.error(error);
        throw error;
    }
}