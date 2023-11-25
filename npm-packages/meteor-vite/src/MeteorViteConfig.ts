import { ResolvedConfig } from 'vite';
import { PluginSettings } from './plugin/Meteor';

export declare interface MeteorViteConfig extends ResolvedConfig {
    meteor?: PluginSettings;
}

