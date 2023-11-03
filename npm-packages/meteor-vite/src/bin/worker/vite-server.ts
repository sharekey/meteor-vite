import FS from 'fs/promises';
import Path from 'path';
import { createServer, resolveConfig, ViteDevServer } from 'vite';
import Logger from '../../Logger';
import MeteorEvents, { MeteorIPCMessage } from '../../meteor/MeteorEvents';
import { MeteorViteConfig } from '../../vite/MeteorViteConfig';
import { MeteorStubs } from '../../vite';
import { ProjectJson } from '../../vite/plugin/MeteorStubs';
import { RefreshNeeded } from '../../vite/ViteLoadRequest';
import CreateIPCInterface, { IPCReply } from './IPC/interface';

let server: ViteDevServer & { config: MeteorViteConfig };
let viteConfig: MeteorViteConfig;
let workerConfig: WorkerRuntimeConfig;
let listening = false;

type Replies = IPCReply<{
    kind: 'viteConfig',
    data: ViteRuntimeConfig;
} | {
    kind: 'refreshNeeded',
    data: {},
}>

type ViteRuntimeConfig = {
    host?: string | boolean;
    port?: number;
    entryFile?: string
}
interface DevServerOptions {
    packageJson: ProjectJson,
    globalMeteorPackagesDir: string;
    meteorParentPid: number;
}

export default CreateIPCInterface({
    async 'vite.getDevServerConfig'(replyInterface: Replies) {
        await sendViteConfig(replyInterface);
    },
    
    async 'meteor.ipcMessage'(reply, data: MeteorIPCMessage) {
        MeteorEvents.ingest(data);
    },
    
    // todo: Add reply for triggering a server restart
    async 'vite.startDevServer'(replyInterface: Replies, { packageJson, globalMeteorPackagesDir, meteorParentPid }: DevServerOptions) {
        let hasBackgroundWorker = false;
        workerConfig = await getWorkerRuntimeConfig();
        const server = await createViteServer({
            packageJson,
            globalMeteorPackagesDir,
            refreshNeeded: () => {
                replyInterface({
                    kind: 'refreshNeeded',
                    data: {},
                })
            },
            buildStart: () => {
                sendViteConfig(replyInterface).catch((error) => {
                    console.error(error);
                    process.exit(1);
                });
            },
        });
        
        try {
            process.kill(workerConfig.pid, 0);
            hasBackgroundWorker = true;
        } catch (error) {}
        
        if (hasBackgroundWorker) {
            console.log(`Vite server running as background process. (pid ${workerConfig.pid})`);
            replyInterface({
                kind: 'viteConfig',
                data: workerConfig.viteConfig,
            })
            return;
        }
        
        await setWorkerRuntimeConfig({
            pid: process.pid,
            meteorPid: process.ppid,
            meteorParentPid,
            viteConfig: {},
        });
        await server.listen()
        await sendViteConfig(replyInterface);
        listening = true
        return;
    },

    async 'vite.stopDevServer'() {
        if (!server) return;
        try {
            console.log('Shutting down vite server...');
            await server.close()
            console.log('Vite server shut down successfully!');
        } catch (error) {
            console.error('Failed to shut down Vite server:', error);
        }
    }
})

async function createViteServer({
    globalMeteorPackagesDir,
    packageJson,
    buildStart,
    refreshNeeded,
}: Omit<DevServerOptions, 'meteorParentPid'> & {
    buildStart: () => void;
    refreshNeeded: () => void;
}) {
    if (server) {
        return server;
    }
    
    viteConfig = await resolveConfig({
        configFile: packageJson?.meteor?.viteConfig,
    }, 'serve');
    
    server = await createServer({
        configFile: viteConfig.configFile,
        plugins: [
            MeteorStubs({
                meteor: {
                    packagePath: Path.join('.meteor', 'local', 'build', 'programs', 'web.browser', 'packages'),
                    isopackPath: Path.join('.meteor', 'local', 'isopacks'),
                    globalMeteorPackagesDir,
                },
                packageJson,
                stubValidation: viteConfig.meteor?.stubValidation,
            }),
            {
                name: 'meteor-handle-restart',
                buildStart,
            },
        ],
    });
    
    process.on('warning', (warning) => {
        if (warning.name !== RefreshNeeded.name) {
            return;
        }
        refreshNeeded();
    })
    
    return server;
}

type WorkerRuntimeConfig = {
    pid: number;
    meteorPid: number;
    meteorParentPid: number;
    viteConfig: ViteRuntimeConfig;
}
const workerRuntimeConfigFilePath = './.meteor-vite-server.pid';

async function getWorkerRuntimeConfig(): Promise<WorkerRuntimeConfig> {
    try {
        const content = await FS.readFile(workerRuntimeConfigFilePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        return {
            pid: 0,
            meteorPid: 0,
            meteorParentPid: 0,
            viteConfig: {}
        }
    }
}

async function setWorkerRuntimeConfig(config: WorkerRuntimeConfig) {
    workerConfig = config;
    await FS.writeFile(workerRuntimeConfigFilePath, JSON.stringify(workerConfig));
}

async function sendViteConfig(reply: Replies) {
    if (!server) {
        Logger.debug('Tried to get config from Vite server before it has been created!');
        return;
    }
    
    const { config } = server;
    
    if (listening) {
        workerConfig.viteConfig = {
            host: config.server?.host,
            port: config.server?.port,
            entryFile: config.meteor?.clientEntry,
        }
    }
    
    reply({
        kind: 'viteConfig',
        data: workerConfig.viteConfig,
    });
    await setWorkerRuntimeConfig(workerConfig);
}