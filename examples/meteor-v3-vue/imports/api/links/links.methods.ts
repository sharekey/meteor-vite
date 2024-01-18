import { Meteor } from 'meteor/meteor';
import LinksCollection from './links.collection';

Meteor.methods({
    'links.create'(link: { title: string, url: string }) {
        LinksCollection.insertAsync(link);
    }
})