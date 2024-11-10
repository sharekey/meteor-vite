import { type BuildPluginFile, BUNDLE_FILE_EXTENSION } from 'meteor/jorgenvatle:vite-bundler/plugin/Compiler';
import Path from 'node:path';
import pc from 'picocolors';
import type { InputOption } from 'rollup';
import { createBuilder, version } from 'vite';
import { MeteorViteError } from '../error/MeteorViteError';
import Logger, { BuildLogger } from '../utilities/Logger';
import { resolveMeteorViteConfig } from './Config';

export async function buildForProduction() {
    Logger.info(`Building with Vite v${version}...`);
    const { config } = await resolveMeteorViteConfig({ mode: 'production' }, 'build');
    
    if (!config.meteor?.clientEntry) {
        throw new MeteorViteError('No client entrypoint specified in Vite config!')
    }
    
    const input: InputOption = {
        client: config.meteor.clientEntry,
    };
    
    
    if (config.meteor.serverEntry) {
        input.server = config.meteor.serverEntry;
    }
    
    const builder = await createBuilder(config);
    
    for (const [name, environment] of Object.entries(builder.environments)) {
        if (name === 'ssr') continue;
        BuildLogger.info(`Preparing ${pc.yellow(name)} bundle...`);
        await builder.build(environment);
    }
    
    Plugin.registerCompiler({
        filenames: [config.meteor.clientEntry, config.meteor.serverEntry],
        extensions: [],
    }, () => new CompilerPlugin({ distDir: config.meteor?.tempDir }))
}

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