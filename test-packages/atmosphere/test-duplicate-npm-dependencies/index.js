import { getStateId } from 'test-externalization';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
    console.log(`[test-externalization] Meteor state ID: ${getStateId()}`);
});

export { getStateId }