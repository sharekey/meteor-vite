import Path from 'path';
import type { BuildPluginFile } from '../../vite-bundler/src/plugin/Compiler';
import { runBootstrapScript } from './util/Bootstrap';
import { CurrentConfig } from './util/CurrentConfig';
import Logger from './util/Logger';

const BUNDLE_FILE_EXTENSION = 'vite.mjs';

class CompilerPlugin {
    constructor(public readonly config: { distDir: string }) {
    }
    processFilesForTarget(files: BuildPluginFile[]) {
        files.forEach(file => {
            const fileMeta = {
                _original: {
                    basename: file.getBasename(),
                    path: file.getPathInPackage(),
                },
                basename: this._formatFilename(file.getBasename()),
                path: this._formatFilename(file.getPathInPackage()),
                relativePath: Path.relative(this.config.distDir, this._formatFilename(file.getPathInPackage())),
            }
            const sourcePath = file.getPathInPackage();
            
            Logger.debug(`[${file.getArch()}] Processing: ${fileMeta.basename}`, { fileMeta });
            
            file.addAsset({
                path: fileMeta.relativePath,
                data: file.getContentsAsBuffer(),
                sourcePath,
            });
        })
    }
    protected _formatFilename(nameOrPath: string) {
        return nameOrPath.replace(`.${BUNDLE_FILE_EXTENSION}`, '');
    }
}

if (CurrentConfig.mode === 'production') {
    try {
        const { entry, outDir } = await runBootstrapScript('buildForProduction');
        Plugin.registerCompiler({
            filenames: [Path.parse(entry.client).base, Path.parse(entry.server || '').base],
            extensions: []
        }, () => new CompilerPlugin({ distDir: Path.dirname(outDir.client) }))
    } catch (error) {
        Logger.error('build failed');
        console.error(error);
        throw error;
    }
}