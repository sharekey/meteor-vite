import { ResolvedConfig } from 'vite';
import { PluginSettings } from './plugin/Config';

export declare interface MeteorViteConfig extends ResolvedConfig {
    meteor?: PluginSettings;
}

