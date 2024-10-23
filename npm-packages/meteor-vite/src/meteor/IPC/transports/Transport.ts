import { createErrorHandler } from '../../../error/ErrorHandler';
import Logger, { createLabelledLogger, type LabelLogger, type LoggerObject } from '../../../utilities/Logger';
import IpcMethods, { WorkerMethod, type WorkerReplyKind, type WorkerResponse } from '../methods';
import pc from 'picocolors';

export type IncomingMessageHandler = (message: WorkerMethod) => Promise<void>;

export abstract class IpcTransport {
    public abstract listen(handler: IncomingMessageHandler): Promise<void> | void;
    public abstract reply(message: WorkerResponse): Promise<void>;
    public abstract active: boolean;
    public readonly logger: LabelLogger;
    
    constructor(public readonly name: string) {
        IPC.addTransport(this);
        this.logger = createLabelledLogger(pc.blue(`${pc.underline(name)} IPC`));
    }
}

class IPCAdapter {
    protected transports: Set<IpcTransport> = new Set();
    constructor() {}
    
    public addTransport(transport: IpcTransport) {
        this.transports.add(transport);
        transport.logger.debug('init');
    }
    
    public async reply<TKind extends WorkerReplyKind>(message: WorkerResponse<TKind>) {
        for (const adapter of this.transports) {
            if (!adapter.active) {
                adapter.logger.debug('inactive');
                continue;
            }
            adapter.logger.debug('reply', { message: message.kind });
            await adapter.reply(message);
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
                adapter.logger.debug('call', Object.entries(message));
                
                if (!message || !message.method) {
                    adapter.logger.error('Vite: Unrecognized worker IPC message', { message });
                    return;
                }
                
                const callWorkerMethod = IpcMethods[message.method];
                
                if (typeof callWorkerMethod !== 'function') {
                    adapter.logger.error(`Vite: The provided IPC method hasn't been defined yet!`, Object.entries(message));
                }
                
                await callWorkerMethod(...message.params as [params: any]).catch(
                    createErrorHandler('Vite: worker process encountered an exception!')
                )
            })
        }
    }
}

export const IPC = new IPCAdapter();

