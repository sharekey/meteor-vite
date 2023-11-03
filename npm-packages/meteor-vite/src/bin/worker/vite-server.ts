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
let listening = false;

type Replies = IPCReply<{
    kind: 'viteConfig',
    data: ViteRuntimeConfig;
} | {
    kind: 'refreshNeeded',
    data: {},
} | {
    kind: 'workerConfig';
    data: WorkerRuntimeConfig;
}>

type ViteRuntimeConfig = {
    host?: string | boolean;
    port?: number;
    entryFile?: string
    backgroundWorker?: WorkerRuntimeConfig;
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
        const worker = await BackgroundWorker.init(meteorParentPid);
        
        if (worker.isRunning) {
            replyInterface({
                kind: 'viteConfig',
                data: worker.config.viteConfig,
            })
            console.log(`Vite server running as background process. (pid ${worker.config.pid})`);
            return;
        }
        
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
        
        await server.listen()
        await sendViteConfig(replyInterface);
        server.printUrls();
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

class BackgroundWorker {
    public static instance: BackgroundWorker;
    protected static readonly configPath = '.meteor-vite/vite-server.pid'
    public static async init(meteorParentPid: number) {
        if (BackgroundWorker.instance) {
            return BackgroundWorker.instance;
        }
        const myConfig = {
            pid: process.pid,
            meteorPid: process.ppid,
            meteorParentPid,
            viteConfig: {}
        };
        try {
            const content = await FS.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(content);
            BackgroundWorker.instance = new BackgroundWorker(config);
        } catch (error) {
            BackgroundWorker.instance = new BackgroundWorker(myConfig)
        }
        
        const worker = BackgroundWorker.instance;
        if (!worker.isRunning) {
            await worker.update(myConfig);
        } else {
            console.log(`Background worker should be running with PID: ${worker.config.pid}`, worker.config);
        }
        return worker;
    }
    constructor(public config: WorkerRuntimeConfig) {
    
    }
    
    public get isRunning() {
        if (!this.config.pid) {
            console.log('No background worker process ID')
            return false;
        }
        if (this.config.pid === process.pid) {
            console.log(`Background worker's process ID is identical to ours`)
            return false;
        }
        try {
            process.kill(this.config.pid, 0);
            return true;
        } catch (error) {
            console.warn(`Background worker not running: ${this.config.pid} (current PID ${process.pid}) `, error);
            return false;
        }
    }
    
    public async update(config: WorkerRuntimeConfig) {
        this.config = config;
        await FS.writeFile(BackgroundWorker.configPath, JSON.stringify(this.config));
    }
    
    public async setViteConfig(viteConfig: WorkerRuntimeConfig['viteConfig']) {
        if (this.config.pid !== process.pid && this.isRunning) {
            console.log(`Skipping Vite config write - config is controlled by different background process: ${this.config.pid}`);
            return;
        }
        await this.update({
            ...this.config,
            viteConfig,
        })
    }
}

async function sendViteConfig(reply: Replies) {
    if (!server) {
        Logger.debug('Tried to get config from Vite server before it has been created!');
        return;
    }
    
    const { config } = server;
    const data = {
        host: config.server?.host,
        port: config.server?.port,
        entryFile: config.meteor?.clientEntry,
    };
    
    reply({
        kind: 'viteConfig',
        data: {
            ...data,
            backgroundWorker: BackgroundWorker.instance.config,
        },
    });
    await BackgroundWorker.instance.setViteConfig(data);
}