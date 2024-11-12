import FS from 'fs';
import { Meteor } from 'meteor/meteor';
import Path from 'node:path';
import pc from 'picocolors';
import type { InputOption } from 'rollup';
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
        const result = await builder.build(environment);
        if ('close' in result) {
            throw new Error('Unexpected build output!');
        }
        const list = fileNames[name] || [];
        fileNames[name] = list;
        
        if (!Array.isArray(result)) {
            result.output.forEach((chunk) => list.push(chunk.fileName));
            continue;
        }
        
        result.forEach(({ output }) => {
            output.forEach((chunk) => list.push(chunk.fileName))
        });
    }
    
    fileNames['server']?.forEach((filename) => {
        const importPath = Path.relative(Path.dirname(CurrentConfig.serverEntryModule), Path.join(outDir.server, filename));
        addServerEntryImport({ importPath, })
        logger.debug('Added import to server entry', {
            importPath,
            filename,
            entry: CurrentConfig.serverEntryModule,
        });
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


function addServerEntryImport({ importPath }: {
    importPath: string,
}) {
    const originalContent = FS.readFileSync(CurrentConfig.serverEntryModule, 'utf-8');
    if (originalContent.includes(importPath)) {
        return;
    }
    FS.writeFileSync(CurrentConfig.serverEntryModule, [`import ${JSON.stringify(importPath)}`, originalContent].join('\n'));
}
