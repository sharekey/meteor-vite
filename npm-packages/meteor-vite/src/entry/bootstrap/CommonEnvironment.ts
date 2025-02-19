import { Meteor } from 'meteor/meteor';
import { onPageLoad } from 'meteor/server-render';

Meteor.startup(async () => {
    // We can rely on the Meteor WebApp for server rendering in browser contexts.
    if (!Meteor.isCordova && !Meteor.isServer) {
        return;
    }
    
    onPageLoad(async (sink) => {
        const { getBoilerplate } = await import('./lib/RuntimeConfig');
        const { head, body, scripts } = await getBoilerplate();
        
        if (head?.length) {
            sink.appendToHead(head.join('\n'));
        }
        if (scripts?.length) {
            const urls = scripts.map((url) => {
                if (url.match(/^https?:/)) {
                    return url;
                }
                if (Meteor.isCordova) {
                    return Meteor.absoluteUrl(url);
                }
                return url;
            });
            sink.appendToHead(urls.map((url) => `<script src="${url}" type="module" crossorigin></script>`).join('\n'))
        }
        if (body?.length) {
            // Todo: meteor/server-render'si mplementation for this appears to be affected by a hoisting issue in Cordova.
            //  - report to meteor?
            try {
                sink.appendToBody(body.join('\n'));
            } catch (error) {
                if (Meteor.isServer) {
                    throw error;
                }
                console.error('Failed to append content to page! Are you using Cordova?', error)
            }
        }
    })
});