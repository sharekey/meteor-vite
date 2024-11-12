import Path from 'path';

function guessCwd () {
    let cwd = process.env.PWD ?? process.cwd()
    const index = cwd.indexOf('.meteor')
    if (index !== -1) {
        cwd = cwd.substring(0, index)
    }
    return cwd
}

const projectRoot = guessCwd();
const configFile = Path.resolve(Path.join(projectRoot, 'vite.config.ts'));
const tempDir = Path.join(projectRoot, '_vite-bundle');
const bundleFileExtension = '_vite';

process.env.METEOR_PROJECT_ROOT = projectRoot;

export const CurrentConfig = {
    projectRoot,
    bootstrapEvalFilename: Path.join(projectRoot, '__meteor-vite-runtime-bootstrap__.ts'),
    configFile,
    mode: process.env.NODE_ENV || 'development',
    bundleFileExtension,
    tempDir,
    serverEntryModule: Path.join(tempDir, 'server', '_entry.mjs'),
    serverProductionProxyModule: Path.join(tempDir, 'server', '_env.mjs'),
} as const;

globalThis.MeteorViteRuntimeConfig = CurrentConfig;