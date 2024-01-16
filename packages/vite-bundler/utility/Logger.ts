import pc from 'picocolors';
import * as process from 'process';

class Logger {
    protected debugEnabled = false;
    constructor() {
        this.debugEnabled = ['true', '*', 'meteor-vite:*'].includes(process.env.DEBUG || 'false')
    }
    public info(message: string, ...args: LogMethodArgs) {
        console.info(pc.blue(`⚡  ${message}`), ...args)
    }
    public error(message: string, ...args: LogMethodArgs) {
        console.info(pc.red(`⚡  ${message}`), ...args)
    }
    public success(message: string, ...args: LogMethodArgs) {
        console.log(pc.green(`⚡  ${message}`), ...args)
    }
    public debug(message: string, ...args: LogMethodArgs) {
        if (!this.debugEnabled) {
            return;
        }
        console.log(pc.dim(pc.blue(`⚡  ${message}`)), ...args)
    }
}

type LogMethodArgs = unknown[];
export default new Logger();
