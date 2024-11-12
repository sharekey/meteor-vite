import pc from 'picocolors';
import { version as viteVersion } from 'vite';
import { version } from '../utilities/Constants';
import { createSimpleLogger } from '../utilities/Logger';
import type { ResolvedMeteorViteConfig } from '../VitePluginSettings';

const startTime = performance.now();

export default new class Instance {
    public readonly logger = Meteor.isDevelopment
                             ? createSimpleLogger(pc.cyan('[DEV]'))
                             : createSimpleLogger('');
    
    public printWelcomeMessage() {
        this.logger.success([
            `Vite ${pc.cyan(`v${viteVersion}`)}`,
            pc.dim(`(MeteorVite ${pc.cyan(`v${version}`)} - ${pc.cyan(Meteor.release)})`)
        ].map((line) => pc.green(line)).join(' '));
    }
    
    public printUrls(config: ResolvedMeteorViteConfig) {
        const printUrl = (key: string, value: string) => [
            pc.white(`> ${key}:`.padEnd(11, ' ')),
            pc.cyan(value.replace(/(\d+)/, pc.bold(pc.cyanBright('$1')))),
        ].join('')
        
        this.logger.success(`Successfully bound to Meteor's WebApp middleware`, [
            '\n',
            printUrl('Meteor', Meteor.absoluteUrl()),
            printUrl('Vite', Meteor.absoluteUrl(config.base)),
            '',
            pc.cyan(`ready in ${Math.round(performance.now() - startTime).toLocaleString()}ms.`),
            '',
        ].join('\n    '));
    }
}