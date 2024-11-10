import { type BuildPluginFile } from 'meteor/jorgenvatle:vite-bundler/plugin/Compiler';
import Path from 'node:path';
import pc from 'picocolors';
import type { InputOption } from 'rollup';
import { createBuilder, version } from 'vite';
import { MeteorViteError } from '../error/MeteorViteError';
import Logger, { BuildLogger } from '../utilities/Logger';
import { resolveMeteorViteConfig } from './Config';

const BUNDLE_FILE_EXTENSION = 'vite.mjs';

export async function buildForProduction() {
    Logger.info(`Building with Vite v${version}...`);
    const { config } = await resolveMeteorViteConfig({ mode: 'production' }, 'build');
    
    if (!config.meteor?.clientEntry) {
        throw new MeteorViteError('No client entrypoint specified in Vite config!')
    }
    
    const input: InputOption = {
        client: config.meteor.clientEntry,
    };
    
    
    const tempDir = config.meteor.tempDir;
    if (config.meteor.serverEntry) {
        input.server = config.meteor.serverEntry;
    }
    
    if (!tempDir) {
        throw new Meteor.Error('no-output-directory', 'Missing output directory to build server and client to');
    }
    
    const builder = await createBuilder(config);
    
    for (const [name, environment] of Object.entries(builder.environments)) {
        if (name === 'ssr') continue;
        BuildLogger.info(`Preparing ${pc.yellow(name)} bundle...`);
        await builder.build(environment);
    }
    
    return {
        entry: {
            client: config.meteor.clientEntry,
            server: config.meteor.serverEntry,
        },
        outDir: {
            client: config.environments.client.build.outDir,
            server: config.environments.server.build?.outDir,
        }
    }
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