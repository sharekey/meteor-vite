import type * as _ from  'meteor/jorgenvatle:vite';
import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';
import { ViteProductionBoilerplate } from '../meteor/boilerplate/Production';

Meteor.startup(async () => {
    console.log('[Vite] Fetching manifest...');
    const manifest = await Assets.getTextAsync('vite/client.manifest.json');
    const boilerplate = new ViteProductionBoilerplate(JSON.parse(manifest));
    
    WebAppInternals.registerBoilerplateDataCallback('vite', (req, data) => {
        Object.assign(data, boilerplate.getBoilerplate());
    });
})

