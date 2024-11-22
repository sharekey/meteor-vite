import FS from 'fs';
import { execaSync } from 'execa';
import OS from 'node:os';
import Path from 'node:path';
import pc from 'picocolors';
import type { RollupOutput, RollupWatcher } from 'rollup';
import { createBuilder, type InlineConfig, version } from 'vite';
import { MeteorViteError } from '../error/MeteorViteError';
import Logger from '../utilities/Logger';
import type { MeteorStubsSettings, ProjectJson, ResolvedMeteorViteConfig } from '../VitePluginSettings';
import { CurrentConfig, resolveMeteorViteConfig } from './Config';
import Instance from './Instance';

export async function buildForProduction() {
    const { config, outDir } = await resolveMeteorViteConfig({ mode: 'production' }, 'build');
    const { logger } = Instance;
    logger.info(`Building with Vite v${version}...`);
    
    if (!config.meteor?.clientEntry) {
        throw new MeteorViteError('No client entrypoint specified in Vite config!')
    }
    
    preparePackagesForExportAnalyzer({ tempMeteorOutDir: CurrentConfig.packageAnalyzer.outDir });
    
    const builder = await createBuilder(config);
    const fileNames: Partial<Record<string, { filePath: string, originalFilePath: string, isEntry?: boolean }[]>> = {};
    
    for (const [context, environment] of Object.entries(builder.environments)) {
        if (context.toLowerCase() === 'ssr') {
            continue;
        }
        
        if (context.toLowerCase() === 'server') {
            if (!config.meteor.serverEntry) {
                logger.info(`Skipping ${pc.yellow(context)} build: no server entry configured`);
                continue;
            }
            if (!config.meteor.enableExperimentalFeatures) {
                logger.warn(
                    'To enable server bundling, you need to set "enableExperimentalFeatures" to true in your Vite' +
                    ' config. To disable these warnings, just remove the "serverEntry" field in your Vite config.'
                );
                continue;
            }
        }
        
        logger.info(`Preparing ${pc.yellow(context)} bundle...`);
        const list = fileNames[context] || [];
        
        
        const result = normalizeBuildOutput(
            await builder.build(environment)
        );
        
        fileNames[context] = list;
        
        result.forEach(({ output }) => {
            output.forEach((chunk) => {
                const originalFilePath = Path.resolve(environment.config.build.outDir, chunk.fileName);
                const ext = `.${CurrentConfig.bundleFileExtension}`;
                const filePath = originalFilePath + ext;
                
                if ('isEntry' in chunk) {
                    list.push({ filePath, originalFilePath, isEntry: chunk.isEntry });
                }
                
                // Appending our own temporary file extension on output files
                // to help Meteor identify files to be processed by our compiler plugin.
                if (originalFilePath.endsWith('map')) {
                    return;
                }
                FS.renameSync(originalFilePath, filePath);
                logger.debug(`Renamed file: ${filePath.replace(ext, pc.yellow(ext))}`);
            });
        });
    }
    
    fileNames['server']?.forEach((file) => {
        if (!file.originalFilePath.endsWith('js')) {
            return;
        }
        if (!file.isEntry) {
            return;
        }
        if (file.filePath.includes('entry-client')) {
            return;
        }
        
        const summary = addServerEntryImport(file);
        logger.debug('Added import to server entry', summary);
    });
    
    return {
        fileNames,
        entry: {
            client: config.meteor.clientEntry,
            server: config.meteor.serverEntry,
        },
        outDir,
    }
}

function normalizeBuildOutput(output:  RollupOutput | RollupOutput[] | RollupWatcher): RollupOutput[] {
    if ('close' in output) {
        throw new MeteorViteError('Seems like build result yielded a watcher instance.', {
            subtitle: `Make sure you don't have a hardcoded 'watch' setting defined in your Vite config.`
        });
    }
    
    if (Array.isArray(output)) {
        return output;
    }
    
    return [output];
}


function addServerEntryImport({ filePath }: {
    filePath: string,
}) {
    const { serverEntryModule } = CurrentConfig;
    const originalContent = FS.readFileSync(serverEntryModule, 'utf-8');
    const importPath = Path.relative(Path.dirname(serverEntryModule), filePath);
    
    if (originalContent.includes(importPath)) {
        return;
    }
    
    FS.writeFileSync(serverEntryModule, [`import ${JSON.stringify(importPath)}`, originalContent].join('\n'));
    
    return {
        importPath,
        filePath,
        serverEntryModule,
    }
}


/**
 * Build a temporary Meteor project to generate package source files that
 * can be analyzed for package export stubbing.
 */
function preparePackagesForExportAnalyzer({ tempMeteorOutDir }: { tempMeteorOutDir: string }) {
    Logger.info('Building packages to make them available to export analyzer...')
    Logger.debug(`Destination dir: ${tempMeteorOutDir}`);
    const startTime = Date.now();
    
    execaSync('meteor', [
        'build',
        tempMeteorOutDir,
        '--directory',
        // Ensure the temporary build doesn't abort for projects with mobile builds
        // Since this is only a temporary build, it shouldn't impact the final production build for the developer.
        '--server=http://localhost:3000',
    ], {
        cwd: CurrentConfig.projectRoot,
        // stdio: ['inherit', 'inherit', 'inherit'],
        env: {
            FORCE_COLOR: '3',
            VITE_METEOR_DISABLED: 'true',
        },
    })
    
    Logger.info(pc.green(`Packages built in ${Date.now() - startTime}ms`));
}

export interface BuildOptions {
    meteor: MeteorStubsSettings['meteor'];
    packageJson: ProjectJson;
}

export type BuildResultChunk = { name?: string, type: string, fileName: string };
export type ParsedConfig = {
    viteConfig: ResolvedMeteorViteConfig;
    inlineBuildConfig: InlineConfig;
    outDir: string;
}
export type TransformedViteManifest = {
    base: string;
    assetsDir: string;
    files: Record<string, ViteManifestFile>;
}
export type ViteManifestFile = {
    file: string;
    src: string;
    name?: string;
    isDynamicEntry?: boolean;
    isEntry?: boolean;
    css?: string[];
    imports?: string[];
    dynamicImports?: string[];
}