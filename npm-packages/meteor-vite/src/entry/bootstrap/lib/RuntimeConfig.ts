import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

interface RuntimeConfigDocument {
    _id: 'boilerplate',
    head?: string[];
    body?: string[];
}

export const RuntimeConfigCollection = new Mongo.Collection<RuntimeConfigDocument>('_meteor-vite', {
    connection: null,
});

export async function setBoilerplate(config: Omit<RuntimeConfigDocument, '_id'>) {
    await RuntimeConfigCollection.upsertAsync({
        _id: 'boilerplate'
    }, {
        $set: config
    })
}

export async function getBoilerplate() {
    const document = await RuntimeConfigCollection.findOneAsync({
        _id: 'boilerplate',
    });
    if (!document) {
        throw new Meteor.Error(404, 'Failed to load Meteor-Vite boilerplate!');
    }
    return document;
}