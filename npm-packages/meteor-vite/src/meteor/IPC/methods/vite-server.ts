import type { MeteorRuntimeConfig } from 'meteor/jorgenvatle:vite-bundler/utility/Helpers';
import { createServer, resolveConfig, type ResolvedServerUrls, ViteDevServer } from 'vite';
import { meteorWorker } from '../../../plugin/Meteor';
import Logger from '../../../utilities/Logger';
import { RefreshNeeded } from '../../../ViteLoadRequest';
import { type ProjectJson, ResolvedMeteorViteConfig } from '../../../VitePluginSettings';
import { MeteorServerBuilder } from '../../ServerBuilder';
import { BackgroundWorker, type WorkerRuntimeConfig } from '../BackgroundWorker';
import { DDPConnection } from '../DDP';
import CreateIPCInterface, { IPCReply } from '../interface';
import MeteorEvents, { MeteorIPCMessage } from '../MeteorEvents';

let viteDevServer: ViteDevServer & { config: ResolvedMeteorViteConfig };
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
    
    // todo: Add reply for triggering a server restart
    async 'vite.server.start'(replyInterface: Replies, { packageJson, meteorParentPid, meteorConfig }: DevServerOptions) {
        const ddpClient = DDPConnection.init(meteorConfig);
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
        
        if (!listening) {
            await server.listen();
            listening = true
            server.printUrls();
        }
        
        await sendViteConfig(replyInterface);
        return;
    },
})

async function createViteServer({
    packageJson,
    buildStart,
    refreshNeeded,
}: Omit<DevServerOptions, 'meteorParentPid'> & {
    buildStart: () => void;
    refreshNeeded: () => void;
}) {
    if (viteDevServer) {
        return viteDevServer;
    }
    
    viteConfig = await resolveConfig({
        mode: 'development',
        configFile: packageJson?.meteor?.vite?.configFile
            // Fallback for deprecated config format
            ?? packageJson?.meteor?.viteConfig,
    }, 'serve');
    
    viteDevServer = await createServer({
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
    
    if (viteConfig.meteor?.serverEntry) {
        await MeteorServerBuilder({ packageJson });
    }
    
    process.on('warning', (warning) => {
        if (warning.name !== RefreshNeeded.name) {
            return;
        }
        refreshNeeded();
    })
    
    return viteDevServer;
}

async function sendViteConfig(reply: Replies) {
    if (!viteDevServer) {
        Logger.debug('Tried to get config from Vite server before it has been created!');
        return;
    }
    
    const { config } = viteDevServer;
    const worker = BackgroundWorker.instance;
    
    await worker.setViteConfig({
        host: config.server?.host,
        port: config.server?.port,
        entryFile: config.meteor?.clientEntry,
        resolvedUrls: viteDevServer.resolvedUrls!,
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

