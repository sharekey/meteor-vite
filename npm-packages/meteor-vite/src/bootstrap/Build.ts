import FS from 'fs';
import { Meteor } from 'meteor/meteor';
import Path from 'node:path';
import pc from 'picocolors';
import type { InputOption, RollupOutput, RollupWatcher } from 'rollup';
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
    const fileNames: Partial<Record<string, string[]>> = {};
    
    for (const [name, environment] of Object.entries(builder.environments).reverse()) {
        if (name.toLowerCase() === 'ssr') continue;
        logger.info(`Preparing ${pc.yellow(name)} bundle...`);
        const output = normalizeBuildOutput(
            // @ts-expect-error Todo: correct configuration issue that causes mismatches between types imported at the root of node_modules
            await builder.build(environment)
        );
        const list = fileNames[name] || [];
        fileNames[name] = list;
        
        output.forEach(({ output }) => {
            output.forEach((chunk) => list.push(chunk.fileName))
        });
    }
    
    fileNames['server']?.forEach((filename) => {
        const summary = addServerEntryImport({
            filePath: Path.resolve(outDir.server, filename)
        });
        logger.debug('Added import to server entry', summary);
    })
    
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
