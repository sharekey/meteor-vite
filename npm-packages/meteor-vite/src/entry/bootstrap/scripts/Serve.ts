import { ViteDevelopmentBoilerplate } from '../boilerplate/Development';
import { resolveMeteorViteConfig } from '../lib/Config';

export async function initializeViteDevServer() {
    await import ('../DevelopmentEnvironment');
}

export async function prepareDevServerBoilerplate() {
    const { modules, needsReactPreamble, config } = await resolveMeteorViteConfig({
        mode: 'development'
    }, 'serve');
    
    return new ViteDevelopmentBoilerplate({
        clientEntry: modules.clientEntry,
        needsReactPreamble,
        baseUrl: config.base,
    });
}