import { createErrorHandler } from '../error/ErrorHandler';
import { DDPConnection } from '../meteor/IPC/DDP';
import { validateIpcChannel } from '../meteor/IPC/interface';
import IpcMethods, { WorkerMethod } from '../meteor/IPC/methods';

async function handleMessage(message: WorkerMethod) {
    if (!message || !message.method) {
        console.error('Vite: Unrecognized worker IPC message', { message });
        return;
    }
    
    const callWorkerMethod = IpcMethods[message.method];
    
    if (typeof callWorkerMethod !== 'function') {
        console.error(`Vite: The provided IPC method hasn't been defined yet!`, { message });
    }
    
    await callWorkerMethod((response) => {
        if (!process.channel) {
            return console.warn(new Error('Vite: No active IPC channel!'))
        }
        validateIpcChannel(process.send);
        process.send(response);
    }, ...message.params as [params: any]).catch(
        createErrorHandler('Vite: worker process encountered an exception!')
    );
}

process.on('message', async (message: WorkerMethod) => handleMessage(message));

if (process.env.DDP_IPC) {
    DDPConnection.get().onIpcCall((message) => {
        return handleMessage(message)
    })
} else {
    validateIpcChannel(process.send);
}

