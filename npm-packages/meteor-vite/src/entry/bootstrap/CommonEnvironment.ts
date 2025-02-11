import { Meteor } from 'meteor/meteor';
import { onPageLoad } from 'meteor/server-render';

interface RuntimeConfigDocument {
    _id: 'boilerplate',
    head: string[];
    body: string[];
}

export const RuntimeConfigCollection = new Mongo.Collection<RuntimeConfigDocument>('_meteor-vite', {
    connection: null,
});

export async function setScripts(scripts: Omit<RuntimeConfigDocument, '_id'>) {
    await RuntimeConfigCollection.updateAsync({
        _id: 'boilerplate'
    }, {
        $set: {
            scripts,
        }
    })
}

Meteor.startup(async () => {
    // We can rely on the Meteor WebApp for server rendering in browser contexts.
    if (!Meteor.isCordova && !Meteor.isServer) {
        return;
    }
    
    onPageLoad(async (sink) => {
        const document = await RuntimeConfigCollection.findOneAsync({
            _id: 'boilerplate',
        });
        if (!document) {
            throw new Meteor.Error(404, 'Failed to load Meteor-Vite client scripts!');
        }
        sink.appendToHead(document.head.join('\n'));
        sink.appendToBody(document.body.join('\n'));
    })
})