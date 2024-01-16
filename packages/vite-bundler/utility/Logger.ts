type LogMethodArgs = unknown[];
import pc from 'picocolors';

class Logger {
    public info(message: string, ...args: LogMethodArgs) {
        console.info(pc.blue(`⚡  ${message}`), ...args)
    }
    public error(message: string, ...args: LogMethodArgs) {
        console.info(pc.red(`⚡  ${message}`), ...args)
    }
    public success(message: string, ...args: LogMethodArgs) {
        console.log(pc.green(`⚡  ${message}`), ...args)
    }
}

export default new Logger();