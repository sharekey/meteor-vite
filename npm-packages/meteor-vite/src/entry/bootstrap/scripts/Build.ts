import FS from 'fs';
import { execaSync } from 'execa';
import Path from 'node:path';
import pc from 'picocolors';
import type { RollupOutput, RollupWatcher } from 'rollup';
import { createBuilder, type InlineConfig, mergeConfig, version } from 'vite';
import { MeteorViteError } from '../../../error/MeteorViteError';
import { Colorize } from '../../../utilities/Constants';
import Logger, { BuildLogger } from '../../../utilities/Logger';
import type { MeteorStubsSettings, ProjectJson, ResolvedMeteorViteConfig } from '../../plugin/Settings';
import { CurrentConfig, resolveMeteorViteConfig } from '../lib/Config';
import Instance from '../lib/Instance';

export async function buildForProduction() {
    const { config, outDir, packageJson } = await resolveMeteorViteConfig({ mode: 'production' }, 'build');
    const { logger } = Instance;
    logger.info(`Building with Vite v${version}...`);
    
    if (!config.meteor?.clientEntry) {
        throw new MeteorViteError('No client entrypoint specified in Vite config!')
    }
    
    preparePackagesForExportAnalyzer({ 
        mainModule: packageJson.meteor.mainModule
    });
    // todo: refactor into environment config
    config.meteor.meteorStubs.meteor.buildProgramsPath = CurrentConfig.packageAnalyzer.buildProgramsDir;
    
    const builder = await createBuilder(config);
    const fileNames: Partial<Record<string, { filePath: string, originalFilePath: string, isEntry?: boolean }[]>> = {};
    
    for (const [context, environment] of Object.entries(builder.environments)) {
        if (context.toLowerCase() === 'ssr') {
            continue;
        }
        
        if (context.toLowerCase() === 'server') {
            if (!config.meteor.serverEntry) {
                logger.info(`Skipping ${Colorize.arch(context)} build: no server entry configured`);
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
        
        logger.info(`Preparing ${Colorize.arch(context)} bundle...`);
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
function preparePackagesForExportAnalyzer({ mainModule }: { mainModule: { client: string } }) {
    const inDir = CurrentConfig.packageAnalyzer.inDir;
    const outDir = CurrentConfig.packageAnalyzer.outDir;
    
    BuildLogger.info('Building packages to make them available to export analyzer...')
    BuildLogger.debug(`Destination dir: ${outDir}`);
    
    const startTime = Date.now();
    const filesToCopy = [
        Path.join('.meteor', '.finished-upgraders'),
        Path.join('.meteor', '.id'),
        Path.join('.meteor', 'packages'),
        Path.join('.meteor', 'platforms'),
        Path.join('.meteor', 'release'),
        Path.join('.meteor', 'versions'),
        Path.join('.meteor', 'local', 'resolver-result-cache.json'),
        'package.json',
        mainModule.client,
    ]
    const directoriesToCopy = [
        Path.join('.meteor', 'local', 'dev_bundle'),
        Path.join('.meteor', 'local', 'plugin-cache'),
        Path.join('.meteor', 'local', 'bundler-cache'),
        'node_modules',
        'packages',
    ];
    const replaceMeteorPackages = [
        { startsWith: 'standard-minifier', replaceWith: '' },
        { startsWith: 'refapp:meteor-typescript', replaceWith: 'typescript' },
        // todo: implement replacePackages config option from package.json
    ]
    
    // Copy files from `.meteor`
    for (const file of filesToCopy) {
        const from = Path.join(CurrentConfig.projectRoot, file)
        const to = Path.join(inDir, file)
        FS.mkdirSync(Path.dirname(to), { recursive: true });
        FS.copyFileSync(from, to)
    }
    
    // Symlink to source project's `packages` and `node_modules` folders
    for (const dir of directoriesToCopy) {
        const from = Path.join(CurrentConfig.projectRoot, dir);
        const to = Path.join(inDir, dir);
        
        if (!FS.existsSync(from)) continue;
        if (FS.existsSync(to)) continue;
        
        FS.symlinkSync(from, to);
    }
    
    // Remove/replace conflicting Atmosphere packages
    {
        const file = Path.join(inDir, '.meteor', 'packages')
        let content = FS.readFileSync(file, 'utf8')
        for (const pack of replaceMeteorPackages) {
            const lines = content.split('\n')
            content = lines.map(line => {
                if (!line.startsWith(pack.startsWith)) {
                    return line;
                }
                Logger.debug(`Removed from intermediary Meteor packages:\n L ${Colorize.textSnippet(line)}`);
                return pack.replaceWith || '';
            }).join('\n')
        }
        FS.writeFileSync(file, content)
    }
    // Remove server entry
    {
        const file = Path.join(inDir, 'package.json')
        const data = JSON.parse(FS.readFileSync(file, 'utf8'))
        data.meteor = {
            mainModule: {
                client: data.meteor.mainModule.client,
            },
        }
        FS.writeFileSync(file, JSON.stringify(data, null, 2))
    }
    // Only keep meteor and npm package imports to enable lazy packages
    {
        const file = Path.join(inDir, mainModule.client)
        const lines = FS.readFileSync(file, 'utf8').split('\n');
        const imports = lines.filter(line => {
            if (!line.startsWith('import')) return false;
            if (line.includes('meteor/')) {
                BuildLogger.debug('Keeping meteor import line:', line);
                return true;
            }
            if (!line.match(/["'`]\./)) {
                BuildLogger.debug('Keeping non-meteor import line', line);
                return true;
            }
            BuildLogger.debug('Stripped import line from intermediary build:', line);
            return false;
        })
        FS.writeFileSync(file, imports.join('\n'))
    }
    
    const METEOR_PACKAGE_DIRS = [
        Path.join(CurrentConfig.projectRoot, 'packages'),
    ]
    
    if (process.env.METEOR_PACKAGE_DIRS) {
        METEOR_PACKAGE_DIRS.push(process.env.METEOR_PACKAGE_DIRS);
    }
    
    execaSync('meteor', [
        'build',
        outDir,
        '--directory',
        // Ensure the temporary build doesn't abort for projects with mobile builds
        // Since this is only a temporary build, it shouldn't impact the final production build for the developer.
        '--server=http://localhost:3000',
    ], {
        cwd: inDir,
        // stdio: ['inherit', 'inherit', 'inherit'],
        env: {
            FORCE_COLOR: '3',
            VITE_METEOR_DISABLED: 'true',
            METEOR_PACKAGE_DIRS: METEOR_PACKAGE_DIRS.join(':'),
        },
    })
    
    BuildLogger.success(`Packages built in ${(Date.now() - startTime).toLocaleString()}ms`);
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