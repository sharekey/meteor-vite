import pc from 'picocolors';
import type { BaseDocument, DataStreamDocument, DataStreamLogType } from '../api/Collections';
import { Methods } from '../api/Endpoints';
import { inspect } from 'node:util';

class DDPLogger {
    protected readonly type: DataStreamLogType = 'log:shared';
    
    constructor() {
        if (Meteor.isServer) {
            this.type = 'log:client';
        }
    }
    
    protected send(log: Omit<DataStreamDocument, 'type' | keyof BaseDocument> & { args: unknown[] }) {
        const document: Omit<DataStreamDocument, keyof BaseDocument> = Object.assign({}, log, {
            type: this.type,
            message: [log.message, ...this.serializeArgs(log.args)].join(' '),
        });
        
        if (!Meteor.isServer) {
            Meteor.callAsync('meteor-vite:log', document).catch((error) => {
                console.error('Failed to log message', error);
            });
            return;
        }
        
        Methods['meteor-vite:log'](document).catch((error) => {
            console.error('Failed to log message', error);
        });
    }
    
    protected styleMessage(data: Pick<DataStreamDocument, 'message' | 'level' | 'sender'>) {
        const prefix = data.sender ? pc.dim(`[⚡ ${data.sender}]`) : '⚡ ';
        switch (data.level) {
            case 'info':
                return pc.blue(`${prefix} ${data.message}`);
            case 'error':
                return pc.red(`${prefix} ${data.message}`);
            case 'success':
                return pc.green(`${prefix} ${data.message}`);
            case 'debug':
                return pc.dim(pc.blue(`${prefix} ${data.message}`));
        }
    }
    
    protected serializeArgs(args: LogMethodArgs) {
        return args.map((data) => {
            return inspect(data, { depth: 2, colors: true });
        });
    }
    
    public print(log: DataStreamDocument) {
        const levels: Record<DataStreamDocument['level'], (...args: LogMethodArgs) => void> = {
            info: (message: unknown, ...args: unknown[]) => console.info(this.styleMessage({ message: String(message), level: 'info' }), ...args),
            error: (message: unknown, ...args: unknown[]) => console.error(this.styleMessage({ message: String(message), level: 'error' }), ...args),
            success: (message: unknown, ...args: unknown[]) => console.log(this.styleMessage({ message: String(message), level: 'success' }), ...args),
            debug: (message: unknown, ...args: unknown[]) => console.debug(this.styleMessage({ message: String(message), level: 'debug' }), ...args),
        }
        
        if (log.level in levels) {
            return levels[log.level](log.message);
        }
        
        console.error('Unknown log level', log);
    }
    
    public info(message: string, ...args: LogMethodArgs) {
        this.send({ message, args, level: 'info' });
    }
    public error(message: string, ...args: LogMethodArgs) {
        this.send({ message, args, level: 'error' });
    }
    public success(message: string, ...args: LogMethodArgs) {
        this.send({ message, args, level: 'success' });
    }
    public debug(message: string, ...args: LogMethodArgs) {
        this.send({ message, args, level: 'debug' });
    }
}

type LogMethodArgs = unknown[];

export default new DDPLogger();