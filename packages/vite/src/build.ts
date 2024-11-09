import { runBootstrapScript } from './util/Bootstrap';

try {
    await runBootstrapScript('buildForProduction')
} catch (error) {
    console.error('⚡ build failed');
    throw error;
}