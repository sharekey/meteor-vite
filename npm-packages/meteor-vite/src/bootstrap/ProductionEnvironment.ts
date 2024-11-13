import type * as _ from  'meteor/jorgenvatle:vite';
import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';
import { ViteProductionBoilerplate } from '../meteor/boilerplate/Production';
import type { ViteManifestFile } from '../meteor/IPC/methods/build';

Meteor.startup(async () => {
    console.log('[Vite] Fetching manifest...');
    const manifest = await Assets.getTextAsync('vite/client.manifest.json');
    const files: Record<string, ViteManifestFile> = JSON.parse(manifest);
    const boilerplate = new ViteProductionBoilerplate({
        base: 'vite',
        assetsDir: 'vite-assets',
        files,
    });
    
    console.log(boilerplate.viteManifest);
    
    WebAppInternals.registerBoilerplateDataCallback('vite', async (req, data) => {
        try {
            const { dynamicHead, dynamicBody } = boilerplate.getBoilerplate();
            
            console.log({ dynamicBody, dynamicHead });
        } catch (error) {
            console.warn(error);
            throw error;
        }
    });
})

