import { Meteor } from 'meteor/meteor';
import {
    type BaseDocument,
    DataStreamCollection,
    type DataStreamDocument,
    StatusCollection,
    type StatusDocument,
} from './Collections';

Meteor.startup(() => {
    if (Meteor.isProduction) {
        return;
    }
    
    Meteor.methods({
        async 'meteor-vite:status/update'(status: Omit<StatusDocument, keyof BaseDocument>) {
            await StatusCollection.upsertAsync(
                { type: status.type },
                {
                    $set: {
                        data: Object.assign(status.data, { updatedAt: new Date() }),
                    },
                    $setOnInsert: {
                        createdAt: new Date(),
                    }
                },
            );
        },
        async 'meteor-vite:log'(log: Omit<DataStreamDocument, keyof BaseDocument>) {
            await DataStreamCollection.insertAsync(Object.assign(log, {
                createdAt: new Date(),
            }));
        },
    });
});