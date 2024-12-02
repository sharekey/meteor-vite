import type { CurrentConfig } from './util/CurrentConfig';

declare global {
    namespace globalThis {
        var MeteorViteRuntimeConfig: typeof CurrentConfig;
    }
}
