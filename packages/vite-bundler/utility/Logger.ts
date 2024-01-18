import pc from 'picocolors';

class Logger {
    protected debugEnabled = false;
    protected static DEBUG_ENV_TRIGGERS = [
        'true',
        '*',
        'vite-bundler:*',
    ]
    constructor() {
        const debugEnv = process.env.DEBUG || 'false';
        this.debugEnabled = !!debugEnv.trim().split(/\s+/).find((field) => {
            return Logger.DEBUG_ENV_TRIGGERS.includes(field.trim())
        });
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
        console.debug(pc.dim(pc.blue(`⚡  ${message}`)), ...args)
    }
}

type LogMethodArgs = unknown[];
export default new Logger();
