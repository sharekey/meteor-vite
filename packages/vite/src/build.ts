import { runBootstrapScript } from './util/Bootstrap';
import { CurrentConfig } from './util/CurrentConfig';
import Logger from './util/Logger';

if (CurrentConfig.mode === 'production') {
    try {
        await runBootstrapScript('buildForProduction')
    } catch (error) {
        Logger.error('build failed');
        console.error(error);
        throw error;
    }
}
