import FS from 'fs';
import { type BuildPluginFile } from 'meteor/jorgenvatle:vite-bundler/plugin/Compiler';
import Path from 'node:path';
import pc from 'picocolors';
import type { InputOption } from 'rollup';
import { createBuilder, version } from 'vite';
import { CurrentConfig } from '../../../../packages/vite/src/util/CurrentConfig';
import { MeteorViteError } from '../error/MeteorViteError';
import Logger, { BuildLogger } from '../utilities/Logger';
import type { ProjectJson } from '../VitePluginSettings';
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
    
    
    const tempDir = config.meteor.tempDir;
    if (config.meteor.serverEntry) {
        input.server = config.meteor.serverEntry;
    }
    
    if (!tempDir) {
        throw new Meteor.Error('no-output-directory', 'Missing output directory to build server and client to');
    }
    
    const builder = await createBuilder(config);
    const fileNames: string[] = [];
    
    for (const [name, environment] of Object.entries(builder.environments).reverse()) {
        if (name.toLowerCase() === 'ssr') continue;
        BuildLogger.info(`Preparing ${pc.yellow(name)} bundle...`);
        const result = await builder.build(environment);
        if ('close' in result) {
            throw new Error('Unexpected build output!');
        }
        if (!Array.isArray(result)) {
            result.output.forEach((chunk) => fileNames.push(chunk.fileName));
            continue;
        }
        
        result.forEach(({ output }) => {
            output.forEach((chunk) => fileNames.push(chunk.fileName))
        });
    }
    
    return {
        fileNames,
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


async function prepareServerEntry({ sourceFile, importPath }: {
    sourceFile: string,
    importPath: string,
}) {
    FS.mkdirSync(Path.dirname(importPath), { recursive: true });
    const originalContent = FS.readFileSync(sourceFile, 'utf-8');
    if (originalContent.includes(importPath)) {
        return;
    }
    FS.writeFileSync(sourceFile, [`import ${JSON.parse(importPath)}`, originalContent].join('\n'));
}
