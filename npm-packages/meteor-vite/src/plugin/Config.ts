import { MeteorViteConfig } from '../MeteorViteConfig';
import { Plugin, mergeConfig } from 'vite';

export default function configure(config: MeteorViteConfig): Plugin {
    return {
        name: 'meteor-vite:config',
        configResolved(resolvedConfig) {
            mergeConfig(config, resolvedConfig);
        }
    }
}