import { Meteor } from 'meteor/meteor';
import { onPageLoad } from 'meteor/server-render';

export const RuntimeConfigCollection = new Mongo.Collection<{
    _id: 'scripts',
    scripts: string[];
}>('_meteor-vite', {
    connection: null,
});

export async function setScripts(scripts: string[]) {
    await RuntimeConfigCollection.updateAsync({
        _id: 'scripts'
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
            _id: 'scripts',
        });
        if (!document) {
            throw new Meteor.Error(404, 'Failed to load Meteor-Vite client scripts!');
        }
        sink.appendToHead(document.scripts.join('\n'));
    })
})