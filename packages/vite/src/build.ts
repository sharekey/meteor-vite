import Path from 'path';
import { runBootstrapScript } from './util/Bootstrap';
import { CurrentConfig } from './util/CurrentConfig';
import Logger from './util/Logger';

if (CurrentConfig.mode === 'production') {
    try {
        const { entry, outDir } = await runBootstrapScript('buildForProduction');
        Plugin.registerCompiler({
            filenames: [Path.parse(entry.client).base, Path.parse(entry.server).base],
            extensions: []
        }, () => {})
    } catch (error) {
        Logger.error('build failed');
        console.error(error);
        throw error;
    }
}
