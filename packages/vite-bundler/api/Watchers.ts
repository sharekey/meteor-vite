import { DataStreamCollection } from './Collections';

export function watchDataStreamLogs() {
    DataStreamCollection.find({}).observe({
        added(document) {
            console.log('New log:', document);
        },
    })
}