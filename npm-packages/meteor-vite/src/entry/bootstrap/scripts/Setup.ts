import FS from 'node:fs';
import Path from 'node:path';
import type { ModulePreloadOptions } from 'vite';
import { MeteorViteError } from '../../../error/MeteorViteError';
import { homepage } from '../../../utilities/Constants';
import Logger, { createSimpleLogger } from '../../../utilities/Logger';
import pc from 'picocolors';
import { CurrentConfig } from '../lib/Config';

const logger = createSimpleLogger('Setup');

export function setupProject() {
    validateVersions();
    cleanupPreviousBuilds();
    prepareServerEntry();
    // Create entry modules for the server.
}

function validateVersions() {
    logger.info(`jorgenvatle:vite v${global.meteorVite?.version}`);
    const expectedVersion = {
        meteorPackage: '1.0.2',
        npmPackage: '3.1.0'
    }
    
    // Todo: run validation
}

/**
 * Clean up temporary files created by previous production builds.
 * Remaining build files can interfere with the dev server
 */
function cleanupPreviousBuilds() {
    if (CurrentConfig.productionPreview) {
        return;
    }
    FS.rmSync(CurrentConfig.outDir, { recursive: true, force: true });
    logger.info(`Cleaned up old build output in ${pc.green(CurrentConfig.outDir)}`);
}


/**
 * Create an empty entry module that can imported by Meteor's mainModule configured in package.json.
 */
function prepareServerEntry() {
    FS.mkdirSync(Path.dirname(CurrentConfig.serverEntryModule), { recursive: true });
    FS.writeFileSync(
        Path.join(
            Path.dirname(CurrentConfig.serverEntryModule),
            '.gitignore'
        ),
        '*'
    );
    FS.writeFileSync(CurrentConfig.serverEntryModule, '// Dynamic entrypoint for the Meteor server. Imports are added here during builds');
}

/**
 * Add an import for the Vite-built server entry module to Meteor's configured mainModule.
 * This ensures that assets built by Vite will actually be loaded by the Meteor server after
 * creating a production build. Otherwise, the files emitted by Vite will be ignored by the
 * Meteor server.
 */
function injectServerEntryImport(mainModule: string | undefined) {
    if (!mainModule) {
        throw new MeteorViteError('Could not find a server mainModule path in your package.json!', {
            subtitle: `Visit ${pc.blue(homepage)} for more details`
        })
    }
    
    const originalContent = FS.readFileSync(mainModule, 'utf-8');
    const importPath = Path.relative(Path.dirname(mainModule), CurrentConfig.serverEntryModule);
    
    if (originalContent.includes(importPath)) {
        return;
    }
    
    Logger.warn(`Meteor-Vite needs to write to the Meteor main module defined in your package.json`);
    Logger.warn(`If you've migrated an existing project, please make sure to move any existing code in this file over to the entry module specified in your Vite config.`);
    
    
    FS.writeFileSync(mainModule, [
        `/**`,
        ` * These modules are automatically imported by jorgenvatle:vite.`,
        ` * You can commit these to your project or move them elsewhere if you'd like,`,
        ` * but they must be imported somewhere in your Meteor mainModule.`,
        ` *`,
        ` * More info: https://github.com/JorgenVatle/meteor-vite#lazy-loaded-meteor-packages`,
        ` **/`,
        `import ${JSON.stringify(importPath)}`,
        '/** End of vite auto-imports **/',
        originalContent,
    ].join('\n'));
}

function writeToPathSync(path: string, content: string) {
    FS.mkdirSync(Path.dirname(path), { recursive: true });
    FS.writeFileSync(path, content);
}

export function serverMainModule({ meteorMainModule, viteMainModule }: {
    meteorMainModule: string | undefined,
    viteMainModule?: string | undefined;
}) {
    injectServerEntryImport(meteorMainModule);
    const importLines = [
        `import "meteor-vite/bootstrap/ProductionEnvironment"`,
    ];
    
    if (viteMainModule) {
        importLines.push(
            `import ${JSON.stringify(Path.resolve(CurrentConfig.projectRoot, viteMainModule))}`,
        )
    }
    
    writeToPathSync(CurrentConfig.serverProductionProxyModule, importLines.join('\n'));
    return CurrentConfig.serverProductionProxyModule;
}

export function clientMainModule({ viteMainModule, modulePreload }: {
    viteMainModule?: string | undefined;
    modulePreload?: boolean | ModulePreloadOptions | undefined;
}) {
    const importLines = [];
    let polyfill = true;
    
    if (modulePreload === false) {
        polyfill = false;
    }
    
    if (typeof modulePreload === 'object' && modulePreload.polyfill === false) {
        polyfill = false;
    }
    
    if (polyfill) {
        importLines.push(`import "vite/modulepreload-polyfill"`);
    }
    
    if (viteMainModule) {
        importLines.push(
            `import ${JSON.stringify(Path.resolve(CurrentConfig.projectRoot, viteMainModule))}`,
        )
    }
    
    writeToPathSync(CurrentConfig.clientEntryModule, importLines.join('\n'));
    return CurrentConfig.clientEntryModule;
}