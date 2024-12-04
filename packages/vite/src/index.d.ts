import type { CurrentConfig } from './util/CurrentConfig';

declare global {
    interface MeteorViteRuntimeConfig {
    
    }
    
    namespace globalThis {
        var MeteorViteRuntimeConfig: (typeof CurrentConfig) & MeteorViteRuntimeConfig;
        var _meteorVite: undefined | {
            name: string;
            version: string;
        }
    }
}
