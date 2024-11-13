import FS from 'fs';
import Path from 'node:path';
import pc from 'picocolors';
import type { RollupOutput, RollupWatcher } from 'rollup';
import { createBuilder, version } from 'vite';
import { CurrentConfig } from '../../../../packages/vite/src/util/CurrentConfig';
import { MeteorViteError } from '../error/MeteorViteError';
import { resolveMeteorViteConfig } from './Config';
import Instance from './Instance';

export async function buildForProduction() {
    const { config, outDir } = await resolveMeteorViteConfig({ mode: 'production' }, 'build');
    const { logger } = Instance;
    logger.info(`Building with Vite v${version}...`);
    
    if (!config.meteor?.clientEntry) {
        throw new MeteorViteError('No client entrypoint specified in Vite config!')
    }
    
    const builder = await createBuilder(config);
    const fileNames: Partial<Record<string, { filePath: string, originalFilePath: string, isEntry?: boolean }[]>> = {};
    
    for (const [context, environment] of Object.entries(builder.environments)) {
        if (context.toLowerCase() === 'ssr') {
            continue;
        }
        
        logger.info(`Preparing ${pc.yellow(context)} bundle...`);
        const list = fileNames[context] || [];
        
        
        const result = normalizeBuildOutput(
            // @ts-expect-error Todo: correct configuration issue that causes mismatches between types imported at the root of node_modules
            await builder.build(environment)
        );
        
        fileNames[context] = list;
        
        result.forEach(({ output }) => {
            output.forEach((chunk) => {
                const originalFilePath = Path.resolve(environment.config.build.outDir, chunk.fileName);
                const ext = `.${CurrentConfig.bundleFileExtension}`;
                const filePath = originalFilePath + ext;
                
                list.push({ filePath, originalFilePath, isEntry: chunk.isEntry });
                
                // Appending our own temporary file extension on output files
                // to help Meteor identify files to be processed by our compiler plugin.
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
