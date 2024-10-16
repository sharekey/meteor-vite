import type { DataStreamDocument, DataStreamLogLevels } from 'meteor/jorgenvatle:vite-bundler/api/Collections';
import { inspect } from 'util';
import WS from 'ws';
import SimpleDDP from 'simpleddp';
import { createLabelledLogger } from '../../utilities/Logger';
import { MeteorViteMethods } from 'meteor/jorgenvatle:vite-bundler/api/Endpoints';

export class DDPConnection {
    protected readonly client: SimpleDDP;
    protected _logger = createLabelledLogger('DDPConnection');
    public logger: DDPLogger;
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
    }
    
    public async call<TMethod extends keyof MeteorViteMethods>(method: TMethod, ...params: Parameters<MeteorViteMethods[TMethod]>) {
        return this.client.call(method, ...params);
    }
    
    public get connected() {
        return this.client?.connected;
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
}