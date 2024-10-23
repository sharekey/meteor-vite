import { createErrorHandler } from '../error/ErrorHandler';
import { DDPConnection } from '../meteor/IPC/DDP';
import IpcMethods, { WorkerMethod, type WorkerResponse } from '../meteor/IPC/methods';

async function handleMessage({ message, reply }: { message: WorkerMethod, reply: (response: WorkerResponse) => void }) {
    if (!message || !message.method) {
        console.error('Vite: Unrecognized worker IPC message', { message });
        return;
    }
    
    const callWorkerMethod = IpcMethods[message.method];
    
    if (typeof callWorkerMethod !== 'function') {
        console.error(`Vite: The provided IPC method hasn't been defined yet!`, { message });
    }
    
    await callWorkerMethod((response) => reply(response), ...message.params as [params: any]).catch(
        createErrorHandler('Vite: worker process encountered an exception!')
    );
}

function validateIpcChannel(send: NodeJS.Process['send']): asserts send is Required<Pick<NodeJS.Process, 'send'>>['send'] {
    if (typeof process.send !== 'function') {
        throw new Error('Worker was not launched with an IPC channel!');
    }
}

if (process.env.DDP_IPC) {
    const ddp = DDPConnection.init();
    ddp.onIpcCall((message) => {
        return handleMessage({
            message,
            reply: (response) => {
                ddp.ipcReply(response).catch((error) => {
                    console.warn('Failed to reply to IPC request', error);
                });
            }
        })
    })
} else {
    validateIpcChannel(process.send);
    
    process.on('message', async (message: WorkerMethod) => handleMessage({
        message,
        reply: (response) => {
            if (!process.channel) {
                return console.warn(new Error('Vite: No active IPC channel!'))
            }
            
            validateIpcChannel(process.send);
            process.send(response);
        }
    }));
}

