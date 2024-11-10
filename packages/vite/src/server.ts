import { runBootstrapScript } from './util/Bootstrap';
import { CurrentConfig } from './util/CurrentConfig';
import Logger from './util/Logger';

if (CurrentConfig.mode !== 'production') {
    try {
        await runBootstrapScript('initializeViteDevServer');
        Logger.success('Vite should be ready to go!');
    }  catch (error) {
        Logger.warn('Failed to start Vite dev server!');
        console.error(error);
    }
}

export {}
