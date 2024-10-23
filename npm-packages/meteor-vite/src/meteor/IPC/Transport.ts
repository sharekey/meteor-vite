import { createErrorHandler } from '../../error/ErrorHandler';
import type { WorkerRuntimeConfig } from './BackgroundWorker';
import IpcMethods, { WorkerMethod, type WorkerReplyKind, type WorkerResponse } from './methods';
import type { ViteRuntimeConfig } from './methods/vite-server';

type IncomingMessageHandler = (message: WorkerMethod) => Promise<void>;

interface IpcTransport {
    listen(handler: IncomingMessageHandler): Promise<void>;
    reply(message: WorkerResponse): Promise<void>;
    active: boolean;
}

export async function defineIpcTransport(adapter: IpcTransport) {
    await adapter.listen(async (message) => {
        if (!message || !message.method) {
            console.error('Vite: Unrecognized worker IPC message', { message });
            return;
        }
        
        const callWorkerMethod = IpcMethods[message.method];
        
        if (typeof callWorkerMethod !== 'function') {
            console.error(`Vite: The provided IPC method hasn't been defined yet!`, { message });
        }
        
        await callWorkerMethod((response) => adapter.reply(response), ...message.params as [params: any]).catch(
            createErrorHandler('Vite: worker process encountered an exception!')
        );
    })
}

class IPC {
    constructor(
        protected transports: IpcTransport[]
    ) {}
    
    
    public async reply<TKind extends WorkerReplyKind>(message: WorkerResponse<TKind>) {
        for (const transport of this.transports) {
            if (!transport.active) {
                continue;
            }
            await transport.reply(message);
            break;
        }
    }
}


export interface IpcReplies {
    buildResult: {
        payload:
            | { success: false }
            | {
                  success: true;
                  outDir: string;
                  meteorViteConfig: any,
                  output?: { name?: string, type: string, fileName: string }[]
              };
    }
    viteConfig: ViteRuntimeConfig
    refreshNeeded: void,
    workerConfig: WorkerRuntimeConfig & { listening: boolean }
}
