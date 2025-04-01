import { Meteor } from 'meteor/meteor';
import { onPageLoad } from 'meteor/server-render';

// Register publications and methods
import '../imports/api/links/links.methods';
import '../imports/api/links/links.publications';

Meteor.startup(() => {
    // Code to run on server startup.
    console.log(`Greetings from ${module.id}!`);
});

onPageLoad(sink => {
    // Code to run on every request.
    sink.renderIntoElementById(
        "server-render-target",
        `Server time: ${new Date}`
    );
});
