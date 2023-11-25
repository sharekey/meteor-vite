import { createErrorHandler } from '../error/ErrorHandler';
import { validateIpcChannel } from '../meteor/IPC/interface';
import IpcMethods, { WorkerMethod } from '../meteor/IPC/methods';

process.on('message', async (message: WorkerMethod) => {
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
})


validateIpcChannel(process.send);