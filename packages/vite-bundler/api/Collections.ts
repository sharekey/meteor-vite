import { Mongo } from 'meteor/mongo';
import type { RuntimeConfig } from '../loading/vite-connection-handler';

export const StatusCollection = new Mongo.Collection<StatusDocument>('_meteor-vite.status', { connection: null });
export const DataStreamCollection = new Mongo.Collection<DataStreamDocument>('_meteor-vite.data-stream', { connection: null });

export interface BaseDocument {
    createdAt: Date;
    updatedAt?: Date;
}

export interface StatusDocument extends BaseDocument {
    type: 'vite-config',
    data: RuntimeConfig;
}

export interface DataStreamDocument extends BaseDocument {
    type: 'log:server' | 'log:client' | 'log:shared'
    message: string;
}