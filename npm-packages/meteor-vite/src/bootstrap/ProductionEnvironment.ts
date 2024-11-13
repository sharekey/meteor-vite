import { Meteor } from 'meteor/meteor';

Meteor.startup(async () => {
    console.log('[Vite] Fetching manifest...');
    console.log(await Assets.getTextAsync('vite/client.manifest.json'));
    
    
    // Todo:
    // Parse manifest file
    // Prepare preload directives for entry modules
    // Prepare lazy/low-priority preload directives to be added gradually over time.
})

