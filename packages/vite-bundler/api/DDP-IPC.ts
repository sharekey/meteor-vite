import type { WorkerMethod, WorkerResponse, WorkerResponseHooks } from 'meteor-vite';
import { IpcCollection } from './Collections';

type IpcResponse = WorkerResponse & { data: any }

export class DDP_IPC {
    constructor(protected readonly responseHooks: Partial<WorkerResponseHooks>) {
        Meteor.methods({
            'meteor-vite:ipc': ({ kind, data }: IpcResponse) => {
                const hook = this.responseHooks[kind];
                
                if (typeof hook !== 'function') {
                    return console.warn('Meteor: Unrecognized worker message!', { message: { kind, data }});
                }
                
                return hook(data);
            }
        });
        Meteor.publish('meteor-vite:ipc', async function(method: WorkerMethod) {
            await IpcCollection.insertAsync(method);
        })
    }
    
    public call(method: WorkerMethod) {
        IpcCollection.insertAsync(method).catch((error) => {
            console.error('Vite: Failed to send IPC event!', error);
        })
    }
    
    public setResponseHooks(responseHooks: Partial<WorkerResponseHooks>) {
        Object.assign(this.responseHooks, responseHooks);
    }
}