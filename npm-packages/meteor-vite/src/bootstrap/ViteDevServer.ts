import FS from 'node:fs';
import Path from 'node:path';
import { createServer, resolveConfig, type ViteDevServer } from 'vite';
import { MeteorViteError } from '../error/MeteorViteError';
import { meteorWorker } from '../plugin/Meteor';
import type { ProjectJson } from '../VitePluginSettings';

/**
 * Helper function for Meteor to launch the Vite dev server within a virtual context.
 * This is called internally by the jorgenvatle:vite package when
 * starting Meteor in a development environment.
 */
export async function initializeViteDevServer(): Promise<ViteDevServer> {
    const { packageJson } = resolveContext();
    const config = await resolveConfig({
        configFile: packageJson.meteor.vite?.configFile
    }, 'serve');
    
    const server = await createServer({
        mode: 'development',
        configFile: config.configFile,
        plugins: [
            meteorWorker({
                meteorStubs: { packageJson }
            })
        ]
    });
    
    await server.listen();
    server.printUrls();
    
    return server;
}

function resolveContext(): { packageJson: ProjectJson } {
    const { METEOR_PROJECT_ROOT } = process.env;
    
    if (!METEOR_PROJECT_ROOT) {
        throw new MeteorViteError('Unable to determine root path for your Meteor project')
    }
    
    const packageJsonPath = Path.join(METEOR_PROJECT_ROOT, 'package.json');
    
    if (!FS.existsSync(packageJsonPath)) {
        throw new MeteorViteError(`Could not locate project's package.json file!`, {
            subtitle: packageJsonPath,
        })
    }
    
    const packageJson = JSON.parse(FS.readFileSync(packageJsonPath, 'utf8'))
    
    return {
        packageJson,
    }
}