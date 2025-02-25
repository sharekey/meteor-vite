import type { ViteBoilerplate } from 'meteor-vite/bootstrap/boilerplate/Boilerplate';
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
    protected boilerplateArc = new Set<string>();
    constructor(public readonly config: {
        outDir: string,
        assetsDir: string,
        mode: 'production' | 'development' | string,
        boilerplate: ViteBoilerplate;
    }) {
        Logger.info(`[${config.mode}] Initializing Vite Compiler Plugin...`);
    }
    processFilesForTarget(files: InputFile[]) {
        files.forEach(file => {
            const fileMeta = {
                _original: {
                    basename: file.getBasename(),
                    path: file.getPathInPackage(),
                },
                basename: this._formatFilename(file.getBasename()),
                path: Path.join(this.config.assetsDir, Path.relative(this.config.outDir, this._formatFilename(file.getPathInPackage()))),
                arch: file.getArch(),
            }
            
            Logger.debug(`[${pc.yellow(file.getArch())}] Processing: ${fileMeta.basename}`, pc.dim(inspect({ fileMeta }, { colors: true })));
            
            if (file.getArch().includes('web') && !this.boilerplateArc.has(file.getArch())) {
                const { dynamicHead, dynamicBody } = this.config.boilerplate.getBoilerplate(file.getArch());
                if (dynamicHead) {
                    file.addHtml({
                        data: dynamicHead,
                        section: 'head',
                    })
                }
                if (dynamicBody) {
                    file.addHtml({
                        data: dynamicBody,
                        section: 'body',
                    })
                }
                this.boilerplateArc.add(file.getArch());
                Logger.debug(`[${pc.yellow(file.getArch())}] Added boilerplate to application HTML`, pc.dim(inspect({ dynamicBody, dynamicHead }, { colors: true })));
            }
            
            if (this.config.mode !== 'production') {
                return;
            }
            
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
                const { outDir, assetsDir, boilerplate } = await runBootstrapScript('buildForProduction');
                
                return new CompilerPlugin({ outDir, assetsDir, mode: CurrentConfig.mode, boilerplate });
            } catch (error) {
                Logger.error('build failed');
                console.error(error);
                throw error;
            }
        });
    } else {
        Plugin.registerCompiler({
            filenames: [CurrentConfig.clientEntryModule, 'vite.config.ts', 'vite.config.js'],
            extensions: [],
        }, async () => {
            const boilerplate = await runBootstrapScript('prepareDevServerBoilerplate');
            return new CompilerPlugin({
                outDir: '',
                assetsDir: '',
                mode: CurrentConfig.mode,
                boilerplate,
            });
        })
    }
    
   await cleanup;
}

