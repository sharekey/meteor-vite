import { createErrorHandler } from '../error/ErrorHandler';
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
        validateIpcChannel(process.send);
        process.send(response);
    }, ...message.params as [params: any]).catch(
        createErrorHandler('Vite: worker process encountered an exception!')
    );
}

process.on('message', async (message: WorkerMethod) => handleMessage(message));

if (process.env.WORKER_METHOD) {
    const message: WorkerMethod = JSON.parse(process.env.WORKER_METHOD);
    handleMessage(message);
} else {
    validateIpcChannel(process.send);
}

