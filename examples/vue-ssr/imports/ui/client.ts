import { createApp } from '/imports/ui/main';
import { Meteor } from 'meteor/meteor';
import { VueMeteor } from 'vue-meteor-tracker';

Meteor.startup(() => {
    const { app } = createApp();
    app.use(VueMeteor);
    app.mount('#app');
})