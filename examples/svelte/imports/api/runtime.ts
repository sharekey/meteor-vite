import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const Runtime = new Mongo.Collection<RuntimeDocument>('runtime');

Meteor.publish('runtime', () => {
    return Runtime.find();
});

Meteor.methods({
    'runtime.click': () => {
        const clicks = Runtime.findOne({ _id: 'clicks' })?.value || 0;
        Runtime.upsert({ _id: 'clicks' }, { $set: { value: clicks + 1 } });
    }
})

export interface RuntimeDocument {
    _id: 'clicks';
    value: number;
}

export default Runtime;