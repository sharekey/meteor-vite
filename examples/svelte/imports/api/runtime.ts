import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const RuntimeCollection = new Mongo.Collection<RuntimeDocument>('runtime');


Meteor.methods({
    'runtime.click': () => {
        const clicks = RuntimeCollection.findOne({ _id: 'clicks' })?.value || 0;
        RuntimeCollection.upsert({ _id: 'clicks' }, { $set: { value: clicks + 1 } });
    }
})

export interface RuntimeDocument {
    _id: 'clicks';
    value: number;
}

export default RuntimeCollection;

Meteor.startup(() => {
    if (!Meteor.isServer) {
        return;
    }
    
    Meteor.publish('runtime', () => {
        return RuntimeCollection.find();
    });
    
    Meteor.setInterval(() => {
        RuntimeCollection.upsert({ _id: 'time' }, { $set: { value: new Date() } })
    }, 2500);
})
