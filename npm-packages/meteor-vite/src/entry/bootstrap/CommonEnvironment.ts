import { Meteor } from 'meteor/meteor';
import { onPageLoad } from 'meteor/server-render';
import { getBoilerplate } from './lib/RuntimeConfig';


Meteor.startup(async () => {
    // We can rely on the Meteor WebApp for server rendering in browser contexts.
    if (!Meteor.isCordova && !Meteor.isServer) {
        return;
    }
    
    onPageLoad(async (sink) => {
        const { head, body } = await getBoilerplate();
        
        if (head) {
            sink.appendToHead(head.join('\n'));
        }
        if (body) {
            sink.appendToBody(body.join('\n'));
        }
    })
})