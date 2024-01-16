import pc from 'picocolors';
import { inspect } from 'node:util';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { msToHumanTime } from './Helpers';

class Logger {
    protected debugEnabled = false;
    protected logGithubAnnotations = false;
    protected githubStepSummaryFile;
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
        this.githubStepSummaryFile = process.env.GITHUB_STEP_SUMMARY;
        this.logGithubAnnotations = !!this.githubStepSummaryFile;
    }
    
    protected addStepSummary(message: string, ...args: LogMethodArgs) {
        if (!this.githubStepSummaryFile) {
            return;
        }
        
        const formattedArgs = args.length ? inspect(args) : '';
        fs.appendFileSync(this.githubStepSummaryFile, `⚡  ${message} ${formattedArgs}`);
    }
    
    protected annotate(message: string, options: Partial<{ title: string }>) {
        if (!this.logGithubAnnotations) {
            return;
        }
        
        const data: string[] = Object.entries(options).map(([key, value]) => {
            return `${key}="${value}"`
        });
        
        console.log(`::notice ${data.join()}::${message})`);
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
