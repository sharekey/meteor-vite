import type { MeteorRuntimeConfig } from 'meteor/jorgenvatle:vite-bundler/utility/Helpers';
import { createServer, resolveConfig, type ResolvedServerUrls, ViteDevServer } from 'vite';
import { meteorWorker } from '../../../plugin/Meteor';
import Logger from '../../../utilities/Logger';
import { RefreshNeeded } from '../../../ViteLoadRequest';
import { type ProjectJson, ResolvedMeteorViteConfig } from '../../../VitePluginSettings';
import { BackgroundWorker, type WorkerRuntimeConfig } from '../BackgroundWorker';
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
        const ddpClient = new DDPConnection({
            endpoint: `ws://${meteorConfig.host}:${meteorConfig.port}/websocket`,
        });
        const backgroundWorker = await BackgroundWorker.init(meteorParentPid, ddpClient);
        const Logger = ddpClient.logger;
        
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
        
        await server.listen();
        if (process.env.ENABLE_DEBUG_LOGS) {
            Logger.info(`Vite server started`, { meteorParentPid });
            let heartbeat = 0;
            setInterval(() => {
                Logger.info(`[${process.pid}.${process.ppid}] Heartbeat #${heartbeat++}`);
            }, 5000);
        }
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

