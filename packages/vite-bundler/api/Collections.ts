import { Mongo } from 'meteor/mongo';
import type { RuntimeConfig } from '../loading/vite-connection-handler';

export const StatusCollection = new Mongo.Collection<StatusDocument>('_meteor-vite.status', { connection: null });
export const DataStreamCollection = new Mongo.Collection<DataStreamDocument>('_meteor-vite.data-stream');

export interface BaseDocument {
    createdAt: Date;
    updatedAt?: Date;
}

export interface StatusDocument<TStatus extends keyof MeteorViteStatus = keyof MeteorViteStatus> extends BaseDocument {
    type: TStatus,
    data: MeteorViteStatus[TStatus];
}

interface MeteorViteStatus {
    viteConfig: RuntimeConfig;
    viteWorker: {
        pid: number;
        meteorPid: number;
        meteorParentPid: number;
        lastHeartbeat: Date;
        startedAt: Date;
    }
}

export interface DataStreamDocument extends BaseDocument {
    type: 'log:server' | 'log:client' | 'log:shared'
    message: string;
}