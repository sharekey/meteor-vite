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
    
    // Todo: Instead of serving assets with Meteor's built-in static file handler,
    //  add a custom asset route where we have better control over caching and CORS rules.
    boilerplate.makeViteAssetsCacheable();
    
    WebAppInternals.registerBoilerplateDataCallback('vite', async (req, data) => {
        try {
            const { dynamicBody, dynamicHead } = boilerplate.getBoilerplate();
            
            if (dynamicHead) {
                data.dynamicHead = `${data.dynamicHead || ''}\n${dynamicHead}`;
            }
            
            if (dynamicBody) {
                data.dynamicBody = `${data.dynamicBody || ''}\n${dynamicBody}`;
            }
        } catch (error) {
            console.warn(error);
            throw error;
        }
    });
})

