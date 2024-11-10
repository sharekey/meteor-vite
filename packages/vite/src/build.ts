import { runBootstrapScript } from './util/Bootstrap';
import Logger from './util/Logger';

try {
    await runBootstrapScript('buildForProduction')
} catch (error) {
    Logger.error('build failed');
    console.error(error);
    throw error;
}