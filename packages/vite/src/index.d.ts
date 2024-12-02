import type { CurrentConfig } from './util/CurrentConfig';

declare global {
    interface MeteorViteRuntimeConfig extends (typeof CurrentConfig) {
    
    }
    
    namespace globalThis {
        var MeteorViteRuntimeConfig: MeteorViteRuntimeConfig;
    }
}
