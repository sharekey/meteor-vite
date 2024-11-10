import { isLogMethod, type LogEntry, LogsCollection } from '/imports/api/logger';
import * as util from 'node:util';
import chalk from 'chalk';

function printEntry(entry: LogEntry) {
    const rawMessage = util.formatWithOptions(
        { colors: true },
        ...entry.args.map(arg => JSON.parse(arg))
    );
    const message = rawMessage.split(/[\n\r]+/)
                              .map((line) => `[${chalk.bold.cyan('Client')}] ${line}`)
                              .join('\n');
    process.stdout.write(message + '\n');
}

const insertHook = (userId: string | null, entry: LogEntry) => {
    const logFunction = console[entry.level];
    
    if (!isLogMethod(entry.level, logFunction)) {
        console.warn('Unknown "%s" log level from client', entry.level, entry.args)
        return false;
    }
    
    printEntry(entry);
    return true;
}

LogsCollection.allow({
    insert: insertHook,
    insertAsync: insertHook,
})