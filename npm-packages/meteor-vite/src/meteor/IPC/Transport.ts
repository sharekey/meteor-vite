import { createErrorHandler } from '../../error/ErrorHandler';
import type { WorkerRuntimeConfig } from './BackgroundWorker';
import IpcMethods, { WorkerMethod, type WorkerResponse } from './methods';
import type { ViteRuntimeConfig } from './methods/vite-server';

type IncomingMessageHandler = (message: WorkerMethod) => Promise<void>;

export async function defineIpcTransport(adapter: {
    listen(handler: IncomingMessageHandler): Promise<void>;
    reply(message: WorkerResponse): Promise<void>;
}) {
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