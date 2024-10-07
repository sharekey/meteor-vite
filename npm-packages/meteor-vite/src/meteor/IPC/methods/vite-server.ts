import FS from 'fs/promises';
import type { MeteorRuntimeConfig } from 'meteor/jorgenvatle:vite-bundler/utility/Helpers';
import Path from 'path';
import { createServer, resolveConfig, type ResolvedServerUrls, ViteDevServer } from 'vite';
import { meteorWorker } from '../../../plugin/Meteor';
import Logger from '../../../utilities/Logger';
import { RefreshNeeded } from '../../../ViteLoadRequest';
import { type ProjectJson, ResolvedMeteorViteConfig } from '../../../VitePluginSettings';
import { DDPConnection } from '../DDP';
import CreateIPCInterface, { IPCReply } from '../interface';
import MeteorEvents, { MeteorIPCMessage } from '../MeteorEvents';

let server: ViteDevServer & { config: ResolvedMeteorViteConfig };
let viteConfig: ResolvedMeteorViteConfig;
let listening = false;

export type Replies = IPCReply<{
    kind: 'viteConfig',
    data: ViteRuntimeConfig;
} | {
    kind: 'refreshNeeded',
    data: {},
} | {
    kind: 'workerConfig';
    data: WorkerRuntimeConfig & { listening: boolean };
}>

export type ViteRuntimeConfig = {
    host?: string | boolean;
    port?: number;
    resolvedUrls?: ResolvedServerUrls,
    entryFile?: string
    backgroundWorker?: WorkerRuntimeConfig;
}
export interface DevServerOptions {
    packageJson: ProjectJson,
    meteorParentPid: number;
    meteorConfig: MeteorRuntimeConfig;
}

export default CreateIPCInterface({
    async 'vite.server.getConfig'(replyInterface: Replies) {
        await sendViteConfig(replyInterface);
    },
    
    async 'meteor.events.emit'(reply, data: MeteorIPCMessage) {
        MeteorEvents.ingest(data);
    },
    
    // todo: Add reply for triggering a server restart
    async 'vite.server.start'(replyInterface: Replies, { packageJson, meteorParentPid, meteorConfig }: DevServerOptions) {
        const backgroundWorker = await BackgroundWorker.init(meteorParentPid);
        
        if (backgroundWorker.isRunning) {
            replyInterface({
                kind: 'viteConfig',
                data: backgroundWorker.config.viteConfig,
            })
            Logger.info(`Vite server running as background process. (pid ${backgroundWorker.config.pid})`);
            return process.exit(0);
        }
        
        const server = await createViteServer({
            packageJson,
            meteorConfig,
            refreshNeeded: () => {
                replyInterface({
                    kind: 'refreshNeeded',
                    data: {},
                })
            },
            buildStart: () => {
                sendViteConfig(replyInterface).catch((error) => {
                    Logger.error(error);
                    process.exit(1);
                });
            },
        });
        
        const ddpClient = new DDPConnection({
            endpoint: `ws://${meteorConfig.host}:${meteorConfig.port}/websocket`,
        });
        
        await server.listen();
        ddpClient.logger.info('Vite server started');
        listening = true
        server.printUrls();
        await sendViteConfig(replyInterface);
        return;
    },

    async 'vite.server.stop'() {
        if (!server) return;
        try {
            Logger.info('Shutting down vite server...');
            await server.close()
            Logger.info('Vite server shut down successfully!');
        } catch (error) {
            Logger.error('Failed to shut down Vite server:', error);
        }
    }
})

async function createViteServer({
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
        configFile: packageJson?.meteor?.vite?.configFile
            // Fallback for deprecated config format
            ?? packageJson?.meteor?.viteConfig,
    }, 'serve');
    
    server = await createServer({
        configFile: viteConfig.configFile,
        plugins: [
            meteorWorker({
               meteorStubs: {
                   packageJson,
               }
            }),
            {
                name: 'meteor-handle-restart',
                buildStart,
            },
            {
                name: 'meteor-ipc-middleware',
                configureServer: (server) => {
                    server.middlewares.use('/__meteor__/ipc-message', (req, res, next) => {
                        let body = '';
                        req.on('data', (chunk) => {
                            body += chunk.toString();
                        });
                        req.on('end', () => {
                          const message = JSON.parse(body);
                          MeteorEvents.ingest(message);
                          res.statusCode = 204;
                          next();
                        })
                    })
                }
            }
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

async function sendViteConfig(reply: Replies) {
    if (!server) {
        Logger.debug('Tried to get config from Vite server before it has been created!');
        return;
    }
    
    const { config } = server;
    const worker = BackgroundWorker.instance;
    
    await worker.setViteConfig({
        host: config.server?.host,
        port: config.server?.port,
        entryFile: config.meteor?.clientEntry,
        resolvedUrls: server.resolvedUrls!,
    });
    reply({
        kind: 'viteConfig',
        data: worker.config.viteConfig,
    });
    reply({
        kind: 'workerConfig',
        data: {
            ...worker.config,
            listening,
        },
    })
}

type WorkerRuntimeConfig = {
    pid: number;
    meteorPid: number;
    meteorParentPid: number;
    viteConfig: ViteRuntimeConfig;
}

class BackgroundWorker {
    public static instance: BackgroundWorker;
    protected static readonly configPath = process.env.BACKGROUND_WORKER_PID_PATH || Path.join('.meteor', 'local', 'vite', 'vite-dev-server.pid')
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
            await FS.mkdir(Path.dirname(this.configPath), { recursive: true });
            const content = await FS.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(content);
            BackgroundWorker.instance = new BackgroundWorker(config);
        } catch (error) {
            BackgroundWorker.instance = new BackgroundWorker(myConfig)
        }
        
        const worker = BackgroundWorker.instance;
        if (!worker.isRunning) {
            await worker.update(myConfig);
            worker._watchForParentExit();
        } else {
            Logger.debug(`Background worker should be running with PID: ${worker.config.pid}`, worker.config);
        }
        return worker;
    }
    constructor(public config: WorkerRuntimeConfig) {}
    
    protected _watchForParentExit() {
        // Keep track of Meteor's parent process to exit if it has ended abruptly.
        setInterval(() => {
            if (this._isRunning(this.config.meteorPid)) {
                return;
            }
            Logger.warn('Meteor parent process is no longer running. Shutting down...');
            this.update({
                pid: 0,
                meteorPid: 0,
                meteorParentPid: 0,
                viteConfig: {},
            }).then(() => {
                process.exit(1);
            })
        }, 1_000)
    }
    
    protected _isRunning(pid: number) {
        try {
            process.kill(pid, 0);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    public get isRunning() {
        if (!this.config.pid) {
            Logger.debug('No background worker process ID')
            return false;
        }
        if (this.config.pid === process.pid) {
            Logger.debug(`Background worker's process ID is identical to ours`)
            return false;
        }
        if (!this._isRunning(this.config.pid)) {
            Logger.debug(`Background worker not running: ${this.config.pid} (current PID ${process.pid}) `);
            return false;
        }
        return true;
    }
    
    public async update(config: WorkerRuntimeConfig) {
        this.config = config;
        await FS.writeFile(BackgroundWorker.configPath, JSON.stringify(this.config));
    }
    
    public async setViteConfig(viteConfig: WorkerRuntimeConfig['viteConfig']) {
        if (this.config.pid !== process.pid && this.isRunning) {
            Logger.debug(`Skipping Vite config write - config is controlled by different background process: ${this.config.pid}`);
            return;
        }
        await this.update({
            ...this.config,
            viteConfig,
        })
    }
}