import FS from 'fs';
import type { ProjectJson } from 'meteor-vite/VitePluginSettings';
import Path from 'path';

function guessCwd () {
    let cwd = process.env.PWD ?? process.cwd()
    const index = cwd.indexOf('.meteor')
    if (index !== -1) {
        cwd = cwd.substring(0, index)
    }
    return cwd
}

function parsePackageJson(): ProjectJson {
    const path = Path.join(projectRoot, 'package.json');
    
    if (!FS.existsSync(path)) {
        throw new Error(`⚡ Could not resolve package.json for your project: ${projectRoot}`);
    }
    
    return JSON.parse(FS.readFileSync(path, 'utf8'));
}

const projectRoot = guessCwd();
const packageJson = parsePackageJson();
const configFile = Path.resolve(Path.join(projectRoot, 'vite.config.ts'));

process.env.METEOR_PROJECT_ROOT = projectRoot;

export const CurrentConfig = {
    projectRoot,
    bootstrapEvalFilename: Path.join(projectRoot, '__meteor-vite-runtime-bootstrap__.ts'),
    packageJson,
    configFile,
    mode: process.env.NODE_ENV || 'development',
    bundleFileExtension: '_vite-bundle.tmp',
} as const;

globalThis.MeteorViteRuntimeConfig = CurrentConfig;

console.debug({
    CurrentConfig,
})