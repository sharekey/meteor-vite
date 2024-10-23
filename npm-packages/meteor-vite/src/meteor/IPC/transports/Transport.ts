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
        this.logger = createLabelledLogger(pc.blue(`${pc.underline(name)} IPC`));
    }
}

class IPCAdapter {
    /**
     * Exit current process if all available IPC transports are disconnected
     * for more than 5 seconds.
     */
    protected readonly PROCESS_TIMEOUT = 5_000;
    protected readonly STATUS_UPDATE_INTERVAL = 1000;
    protected readonly transports: Set<IpcTransport> = new Set();
    protected readonly status = {
        connected: false,
        msSinceLastConnection: 0,
    }
    
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
    
    protected updateStatus() {
        for (const transport of this.transports) {
            if (transport.active) {
                this.status.connected = true;
                this.status.msSinceLastConnection = 0;
                return;
            }
        }
        this.status.msSinceLastConnection += this.STATUS_UPDATE_INTERVAL;
        this.status.connected = false;
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
        
        setInterval(() => {
            this.updateStatus();
            
            if (this.status.msSinceLastConnection > this.PROCESS_TIMEOUT) {
                Logger.warn(`All IPC channels closed for more than ${this.PROCESS_TIMEOUT.toLocaleString()}ms. Exiting...`);
                process.exit(1);
            }
        }, this.STATUS_UPDATE_INTERVAL);
    }
}

export const IPC = new IPCAdapter();

