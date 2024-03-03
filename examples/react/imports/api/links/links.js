import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const LinksCollection = new Mongo.Collection('links');

Meteor.methods({
    async 'links.create'(link) {
        await insertLink(link)
    }
})

export async function insertLink({ title, url }) {
    await LinksCollection.insertAsync({ title, url, createdAt: new Date() });
}