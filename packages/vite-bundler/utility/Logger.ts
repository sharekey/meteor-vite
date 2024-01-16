import pc from 'picocolors';
import { inspect } from 'node:util';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { msToHumanTime } from './Helpers';

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
    
    protected addStepSummary(message: string, ...args: LogMethodArgs) {
        const summaryFilePath = process.env.GITHUB_STEP_SUMMARY;
        if (!summaryFilePath) {
            return;
        }
        
        const formattedArgs = args.length ? inspect(args) : '';
        fs.appendFileSync(summaryFilePath, `⚡  ${message} ${formattedArgs}`);
    }
    
    public info(message: string, ...args: LogMethodArgs) {
        this.addStepSummary(message, ...args);
        console.info(pc.blue(`⚡  ${message}`), ...args)
    }
    public error(message: string, ...args: LogMethodArgs) {
        this.addStepSummary(message, ...args);
        console.error(pc.red(`⚡  ${message}`), ...args)
    }
    public success(message: string, ...args: LogMethodArgs) {
        this.addStepSummary(message, ...args);
        console.log(pc.green(`⚡  ${message}`), ...args)
    }
    public debug(message: string, ...args: LogMethodArgs) {
        if (!this.debugEnabled) {
            return;
        }
        this.addStepSummary(message, ...args);
        console.debug(pc.dim(pc.blue(`⚡  ${message}`)), ...args)
    }
    
    public startProfiler(options: { title?: string }) {
        const startTime = performance.now();
        return {
            complete: (message: string) => this.success(`${message} in ${msToHumanTime(performance.now() - startTime)}`)
        }
    }
}

type LogMethodArgs = unknown[];
export default new Logger();
