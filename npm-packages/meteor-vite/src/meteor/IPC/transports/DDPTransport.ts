import type { DDPConnection } from '../DDP';
import type { WorkerResponse } from '../methods';
import { type IncomingMessageHandler, IpcTransport } from './Transport';

export class DDPTransport extends IpcTransport {
    public readonly name = 'DDP';
    constructor(protected ddp: DDPConnection) {
        super();
    }
    
    public listen(handler: IncomingMessageHandler) {
        this.ddp.onIpcCall(message => handler(message));
    }
    
    public async reply(message: WorkerResponse) {
        await this.ddp.ipcReply(message)
    }
    
    public get active() {
        return this.ddp.status.connected;
    }
}