import { DDPConnection } from '../meteor/IPC/DDP';
import { IPC } from '../meteor/IPC/transports/Transport';
import { DDPTransport } from '../meteor/IPC/transports/DDPTransport';
import Logger from '../utilities/Logger';

Logger.info('Spawned new Meteor-Vite worker process');

if (process.env.DDP_IPC) {
    const ddp = new DDPTransport(DDPConnection.init());
    IPC.addTransport(ddp);
}

if (process.channel) {
    const nodeIpc = new IpcNodeTransport();
    IPC.addTransport(nodeIpc);
}

if (!IPC.hasTransports()) {
    throw new Error('Missing valid IPC transport to initiate meteor-vite worker process!');
}

