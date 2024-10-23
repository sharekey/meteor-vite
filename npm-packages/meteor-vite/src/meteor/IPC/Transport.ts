import { createErrorHandler } from '../../error/ErrorHandler';
import IpcMethods, { WorkerMethod, type WorkerResponse } from './methods';

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