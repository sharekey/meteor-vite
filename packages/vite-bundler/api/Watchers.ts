import { Meteor } from 'meteor/meteor';
import { DataStreamCollection } from './Collections';

export function watchDataStreamLogs() {
    if (Meteor.isProduction) {
        throw new Error('meteor-vite data logs are only available in development mode');
    }
    
    if (Meteor.isClient) {
        Meteor.subscribe('meteor-vite:log');
    }
    
    DataStreamCollection.find({}).observe({
        added(document) {
            console.log('New log:', document);
        },
    })
}