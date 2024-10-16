import type { DataStreamDocument } from 'meteor/jorgenvatle:vite-bundler/api/Collections';
import { MeteorViteMethods } from 'meteor/jorgenvatle:vite-bundler/api/Endpoints';
import SimpleDDP from 'simpleddp';
import { inspect } from 'util';
import WS from 'ws';
import { createLabelledLogger } from '../../utilities/Logger';

export class DDPConnection {
    protected readonly client: SimpleDDP;
    protected _logger = createLabelledLogger('DDPConnection');
    public logger: DDPLogger;
    protected readonly _status = {
        lastConnectionTimestamp: Date.now(),
        connected: false,
        pingCount: 0,
        timedOut: false,
    }
    constructor(config: {
        endpoint: string;
    }) {
        this.client = new SimpleDDP({
            endpoint: config.endpoint,
            SocketConstructor: WS,
            reconnectInterval: 1000,
        });
        
        this.logger = new DDPLogger(this);
        
        // @ts-expect-error Bad typings
        this.client.on('error', (error: unknown) => {
            this._logger.error('DDP Error', { error: String(error) });
        });
        this.client.on('connected', () => {
            this._logger.info(`Connected to DDP server`, config);
        });
        this.client.on('disconnected', () => {
            this._logger.info(`Disconnected from DDP server`,  config);
        });
        
        setInterval(() => {
            this.logger.debug(`Ping #${this.status.pingCount++}`);
        }, 10_000);
    }
    
    public async call<TMethod extends keyof MeteorViteMethods>(method: TMethod, ...params: Parameters<MeteorViteMethods[TMethod]>) {
        return this.client.call(method, ...params);
    }
    
    public get status() {
        const TIMEOUT_MS = 30_000;
        const connected = this._status.connected = this.client.connected;
        
        if (connected) {
            this._status.lastConnectionTimestamp = Date.now();
        }
        
        if (Date.now() - this._status.lastConnectionTimestamp > TIMEOUT_MS) {
            this._status.timedOut = true;
        }
        
        return this._status;
    }
}

class DDPLogger {
    protected readonly _logger = createLabelledLogger('DDPLogger');
    constructor(protected readonly ddp: DDPConnection) {
    }
    
    protected log(log: Pick<DataStreamDocument, 'level' | 'message'>) {
        this.ddp.call('meteor-vite:log', {
            type: 'log:server',
            ...log,
            sender: 'vite-dev-server',
        }).catch((error) => {
            this._logger.error('Failed to log message through DDP', error);
        });
    }
    
    protected formatMessage(message: string, args: unknown[]) {
        return [message, ...args.map((data) => {
            return inspect(data, { depth: 2, colors: true });
        })].join(' ');
    }
    
    public info(message: string, ...args: unknown[]) {
        this.log({ level: 'info', message: this.formatMessage(message, args) });
    }
    
    public error(message: string, ...args: unknown[]) {
        this.log({ level: 'error', message: this.formatMessage(message, args) });
    }
    
    public success(message: string, ...args: unknown[]) {
        this.log({ level: 'success', message: this.formatMessage(message, args) });
    }
    
    public debug(message: string, ...args: unknown[]) {
        this.log({ level: 'debug', message: this.formatMessage(message, args) });
    }
    
    public warn(message: string, ...args: unknown[]) {
        this.log({ level: 'warn', message: this.formatMessage(message, args) });
    }
}