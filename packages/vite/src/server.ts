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
} else if (Meteor.isProduction) {
    // Todo: Maybe this could just be injected into the production server bundle.
    try {
        globalThis.Assets = Assets;
        await runBootstrapScript('initializeViteProductionEnvironment');
        Logger.success('Production environment initialized');
    } catch (error) {
        Logger.warn('Failed to initialize production environment!');
        
        /**
         * The current (Meteor v3.0.4) release appears to swallow errors thrown by
         * modules that utilize top-level-awaits.
         *
         * To be as safe as possible, we're going to forcefully terminate the Meteor
         * process instead of throwing to avoid an unfortunate situation where a
         * deployment monitor might report Meteor as healthy when it really is not.
         */
        console.error(error);
        process.exit(1);
    }
}

export {}
