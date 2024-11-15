import { runBootstrapScript } from './util/Bootstrap';
import { CurrentConfig } from './util/CurrentConfig';
import Logger from './util/Logger';

// For local development - forces server to restart when changes are made
// to local npm packages.
import LastReload from './.force-reload-watchfile'
Logger.debug(LastReload);

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
