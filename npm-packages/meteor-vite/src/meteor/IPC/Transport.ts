import { createErrorHandler } from '../../error/ErrorHandler';
import IpcMethods, { WorkerMethod, type WorkerReplyKind, type WorkerResponse } from './methods';

export type IncomingMessageHandler = (message: WorkerMethod) => Promise<void>;

export abstract class IpcTransport {
    abstract listen(handler: IncomingMessageHandler): Promise<void> | void;
    abstract reply(message: WorkerResponse): Promise<void>;
    abstract active: boolean;
    
    constructor() {
        IPC.addTransport(this);
    }
}

export async function defineIpcTransport(adapter: IpcTransport) {
    IPC.addTransport(adapter);
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

class IPCAdapter {
    protected transports: Set<IpcTransport> = new Set();
    constructor() {}
    
    public addTransport(transport: IpcTransport) {
        this.transports.add(transport);
    }
    
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

export const IPC = new IPCAdapter();

