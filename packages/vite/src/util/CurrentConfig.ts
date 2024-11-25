import OS from 'node:os';
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
const productionPreview = process.argv.includes('--production');

process.env.METEOR_PROJECT_ROOT = projectRoot;

export const CurrentConfig = {
    projectRoot,
    bootstrapEvalFilename: Path.join(projectRoot, '__meteor-vite-runtime-bootstrap__.ts'),
    configFile,
    mode: process.env.NODE_ENV || 'development',
    bundleFileExtension,
    tempDir,
    productionPreview,
    
    // Vite bundle will be placed here when building for production.
    // It's important to empty this directory when starting Meteor
    // in development mode.
    outDir: Path.join(tempDir, 'dist'),
    
    serverEntryModule: Path.join(tempDir, 'server', '_entry.mjs'),
    serverProductionProxyModule: Path.join(tempDir, 'server', '_env.mjs'),
    meteorPackagesFile: Path.join(projectRoot, '.meteor', 'packages'),
    
    /**
     * Output directory for a minimal temporary Meteor bundle that can be used for export
     * analysis when building for production.
     */
    packageAnalyzer: {
        inDir: Path.join(OS.tmpdir(), 'meteor-vite', 'in', Path.basename(projectRoot)),
        outDir: Path.join(OS.tmpdir(), 'meteor-vite', Path.basename(projectRoot)),
        get buildProgramsDir() {
            return Path.join(this.outDir, 'bundle', 'programs');
        }
    },
    readmeLink: (section: 'meteor-build-plugins') => `https://github.com/JorgenVatle/meteor-vite#${section}`
} as const;

globalThis.MeteorViteRuntimeConfig = CurrentConfig;