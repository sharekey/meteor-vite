import { ResolvedConfig } from 'vite';
import { StubValidationSettings } from './plugin/Config';

export declare interface MeteorViteConfig extends ResolvedConfig {
    meteor?: {
        /**
         * Vite client entry into Meteor.
         * Not to be confused with your Meteor mainModule.
         *
         * {@link https://github.com/JorgenVatle/meteor-vite#readme}
         */
        clientEntry?: string;
        
        /**
         * Settings for controlling how stubs created by Meteor-Vite are validated.
         * These settings only apply in a development environment. Once the app is bundled for production, runtime
         * stub validation is disabled.
         */
        stubValidation?: StubValidationSettings;
    };
}

