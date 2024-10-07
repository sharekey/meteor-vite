import WS from 'ws';
import SimpleDDP from 'simpleddp';
import { createLabelledLogger } from '../../utilities/Logger';
import { MeteorViteMethods } from 'meteor/jorgenvatle:vite-bundler/api/Endpoints';

export class DDPConnection {
    protected readonly client: SimpleDDP;
    protected logger = createLabelledLogger('DDPConnection');
    constructor(config: {
        endpoint: string;
    }) {
        this.client = new SimpleDDP({
            endpoint: config.endpoint,
            SocketConstructor: WS,
            reconnectInterval: 1000,
        });
        
        // @ts-expect-error Bad typings
        this.client.on('error', (error: unknown) => {
            this.logger.error('DDP Error', error);
        });
        this.client.on('connected', () => {
            this.logger.info(`Connected to DDP server: %s`, config.endpoint);
        });
        this.client.on('disconnected', () => {
            this.logger.info(`Disconnected from DDP server: %s`,  config.endpoint);
        });
    }
    
    public async call<TMethod extends keyof MeteorViteMethods>(method: TMethod, ...params: Parameters<MeteorViteMethods[TMethod]>) {
        return this.client.call(method, ...params);
    }
    
}