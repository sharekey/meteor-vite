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
    
    protected send(log: LogData) {
        const document: Omit<DataStreamDocument, keyof BaseDocument> = {
            type: this.type,
            level: log.level,
            message: [this.styleMessage(log), ...this.serializeArgs(log.args)].join(' '),
        };
        
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
    
    protected styleMessage(data: Pick<LogData, 'message' | 'level'>) {
        switch (data.level) {
            case 'info':
                return pc.blue(`⚡  ${data.message}`);
            case 'error':
                return pc.red(`⚡  ${data.message}`);
            case 'success':
                return pc.green(`⚡  ${data.message}`);
            case 'debug':
                return pc.dim(pc.blue(`⚡  ${data.message}`));
        }
    }
    
    protected serializeArgs(args: LogMethodArgs) {
        return args.map((data) => {
            return inspect(data, { depth: 2, colors: true });
        });
    }
    
    public print(log: DataStreamDocument) {
        const levels: Record<DataStreamDocument['level'], (...args: LogMethodArgs) => void> = {
            info: console.info,
            error: console.error,
            success: console.log,
            debug: console.debug,
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
type LogData = {
    message: string;
    args: LogMethodArgs;
    level: DataStreamDocument['level'];
}

export default new DDPLogger();