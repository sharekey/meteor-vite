import { createErrorHandler } from '../../../error/ErrorHandler';
import IpcMethods, { WorkerMethod, type WorkerReplyKind, type WorkerResponse } from '../methods';

export type IncomingMessageHandler = (message: WorkerMethod) => Promise<void>;

export abstract class IpcTransport {
    abstract listen(handler: IncomingMessageHandler): Promise<void> | void;
    abstract reply(message: WorkerResponse): Promise<void>;
    abstract active: boolean;
    
    constructor() {
        IPC.addTransport(this);
    }
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
    
    public hasTransports() {
        return this.transports.size > 0;
    }
    
    public async listen() {
        if (!this.hasTransports()) {
            throw new Error('Missing valid IPC transport to initiate meteor-vite worker process!');
        }
        
        for (const adapter of this.transports) {
            await adapter.listen(async (message) => {
                if (!message || !message.method) {
                    console.error('Vite: Unrecognized worker IPC message', { message });
                    return;
                }
                
                const callWorkerMethod = IpcMethods[message.method];
                
                if (typeof callWorkerMethod !== 'function') {
                    console.error(`Vite: The provided IPC method hasn't been defined yet!`, { message });
                }
                
                await callWorkerMethod(...message.params as [params: any]).catch(
                    createErrorHandler('Vite: worker process encountered an exception!')
                )
            })
        }
    }
}

export const IPC = new IPCAdapter();

