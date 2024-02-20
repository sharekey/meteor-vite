import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const LinksCollection = new Mongo.Collection('links');

Meteor.methods({
    async 'links.create'(link) {
        await LinksCollection.insertAsync(link);
    }
})
