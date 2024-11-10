import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import safeJson from 'safe-json-stringify';

export interface LogEntry {
    createdAt: Date;
    level: LogLevel;
    args: any[];
}

export const LogsCollection = new Mongo.Collection<LogEntry>('log-entries');

export const Logger: typeof console = new Proxy(console, {
    get(target, level: LogLevel) {
        const value = target[level as keyof typeof console];
        
        if (!isLogMethod(level, value)) {
            return value;
        }
        
        return (...args: any[]) => {
            LogsCollection.insertAsync({
                createdAt: new Date(),
                level,
                args: args.map(arg => safeJson(arg)),
            }).catch(() => {
                // Ignore error to prevent infinite logging loop.
                // Meteor appears to emit an error message anyway, regardless of whether the exception is handled
            });
            value.apply(this, args);
        }
    }
});

export function WrapConsole() {
    if (!Meteor.isClient) {
        throw new Error('wrapConsole() can only be called on the client');
    }
    
    for (const level of loggableLevels) {
        Object.defineProperty(window.console, level, {
            value: Logger[level],
        })
    }
}

type LogLevel = typeof loggableLevels[number];
const loggableLevels = [ 'log', 'info', 'warn', 'error'] as const;
export function isLogMethod(level: LogLevel | string, value: any): value is typeof console[LogLevel]  {
    return loggableLevels.includes(level as LogLevel);
}
