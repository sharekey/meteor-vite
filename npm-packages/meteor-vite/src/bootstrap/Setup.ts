import FS from 'node:fs';
import Path from 'node:path';
import { MeteorViteError } from '../error/MeteorViteError';
import { homepage } from '../utilities/Constants';
import Logger, { createSimpleLogger } from '../utilities/Logger';
import pc from 'picocolors';
import { CurrentConfig } from './Config';

const logger = createSimpleLogger('Setup');

export function setupProject() {
    cleanupPreviousBuilds();
    prepareServerEntry();
    disableIncompatibleBuildPlugins();
    // Create entry modules for the server.
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
        ` * These modules are automatically imported by jorgenvatle:vite-bundler.`,
        ` * You can commit these to your project or move them elsewhere if you'd like,`,
        ` * but they must be imported somewhere in your Meteor mainModule.`,
        ` *`,
        ` * More info: https://github.com/JorgenVatle/meteor-vite#lazy-loaded-meteor-packages`,
        ` **/`,
        `import ${JSON.stringify(importPath)}`,
        '/** End of vite-bundler auto-imports **/',
        originalContent,
    ].join('\n'));
}

function prepareProductionServerProxyModule(serverEntry: string) {
    FS.writeFileSync(CurrentConfig.serverProductionProxyModule, [
        `import "meteor-vite/bootstrap/ProductionEnvironment"`,
        `import ${JSON.stringify(Path.resolve(CurrentConfig.projectRoot, serverEntry))}`,
    ].join('\n'));
    return CurrentConfig.serverProductionProxyModule;
}

export function serverRollupInput(config: { meteorMainModule: string | undefined, viteServerEntry: string }) {
    injectServerEntryImport(config.meteorMainModule);
    return prepareProductionServerProxyModule(config.viteServerEntry);
}

const INCOMPATIBLE_PACKAGES: { startsWith: string, replaceWith: string, reason: string }[] = [
    { startsWith: 'standard-minifier', replaceWith: '', reason: 'Minification is already performed by Vite' },
    { startsWith: 'refapp:meteor-typescript', replaceWith: 'typescript', reason: 'TypeScript is already handled by Vite' },
]

/**
 * Disable incompatible Meteor build plugins.
 * Build plugins like `standard-minifier-js` strip out package caches before we have the chance to
 * analyze them for exports.
 *
 * Since Vite more or less replaces the functionality provided by these plugins, it should be safe
 * to just disable them outright when loading a project with MeteorVite enabled
 */
function disableIncompatibleBuildPlugins() {
    const packagesFileContent = FS.readFileSync(CurrentConfig.meteorPackagesFile, 'utf-8');
    const lines = packagesFileContent.split(/[\r\n]/);
    let disabledCount = 0;
    const readmeLink = CurrentConfig.readmeLink('meteor-build-plugins');
    
    const newContent = lines.map((rawLine) => {
        const line = rawLine.trim();
        for (const { startsWith, replaceWith, reason } of INCOMPATIBLE_PACKAGES) {
            if (!line.startsWith(startsWith)) {
                continue;
            }
            
            disabledCount++;
            const [packageName] = rawLine.split(/\s|@/);
            
            Logger.warn([
                pc.blue(`Meteor package ${pc.underline(pc.yellow(packageName))} will be disabled`),
                ` ${pc.dim('L')}  ${pc.green(reason)}`,
                '',
            ].join(`\n`));
            
            return [
                `## Incompatible with MeteorVite`,
                '## Vite already provides similar functionality so these plugins will likely just slow down the build process unnecessarily',
                `## Reason: ${reason}`,
                `## More info: ${readmeLink}`,
                `${replaceWith} # ${line}`.trim()
            ].join('\n');
        }
        return rawLine;
    }).join('\n');
    
    if (disabledCount) {
        Logger.info(`See the following link for more info on why some packages are disabled: ${readmeLink}`);
    }
    
    FS.writeFileSync(CurrentConfig.meteorPackagesFile, newContent);
}