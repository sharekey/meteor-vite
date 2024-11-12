import { Meteor } from 'meteor/meteor';
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
    try {
        await runBootstrapScript('initializeViteProductionEnvironment');
        Logger.success('Production environment initialized');
    } catch (error) {
        Logger.warn('Failed to initialize production environment!');
        
        // The current version of Meteor has a tendency to swallow errors thrown by
        // modules using top-level-await. So we're logging as well as throwing for good measure.
        console.error(error);
        
        throw error;
    }
}

export {}
