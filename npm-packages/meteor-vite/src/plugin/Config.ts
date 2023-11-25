import { mergeConfig, Plugin } from 'vite';
import { MeteorViteConfig } from '../MeteorViteConfig';

export default function configure(config: MeteorViteConfig): Plugin {
    return {
        name: 'meteor-vite:config',
        configResolved(resolvedConfig) {
            mergeConfig(config, resolvedConfig);
        }
    }
}

export interface StubValidationSettings {
    /**
     * list of packages to ignore export validation for.
     * @example
     * { ignorePackages: ['ostrio:cookies', 'test:ts-modules', ...] }
     */
    ignorePackages?: string[];
    
    /**
     * Will only emit warnings in the console instead of throwing an exception that may prevent the client app
     * from loading.
     * @default true
     */
    warnOnly?: boolean;
    
    /**
     * Whether to completely disable stub validation feature for Meteor-Vite.
     *
     * Tip:
     * You can use a conditional Vite configuration to enable/disable this for your production build
     * {@link https://vitejs.dev/config/#conditional-config}
     *
     * @default false
     */
    disabled?: boolean;
}