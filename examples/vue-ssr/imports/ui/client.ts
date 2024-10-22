import { createApp } from '/imports/ui/main';
import { Meteor } from 'meteor/meteor';
import { VueMeteor } from 'vue-meteor-tracker';

if (!Meteor.isClient) {
    throw new Meteor.Error('client-only', 'The UI client module should only be imported by clients!');
}

Meteor.startup(() => {
    const { app } = createApp();
    app.use(VueMeteor);
    app.mount('#app');
})