import { LinksCollection } from '/imports/api/links';
import { Meteor } from 'meteor/meteor';

// Initializes SSR for the Vue app.
import '/imports/ui/server';

async function insertLink({ title, url }: { title: string, url: string }) {
    await LinksCollection.insertAsync({ title, url, createdAt: new Date() })
}

Meteor.startup(async () => {
    // If the Links collection is empty, add some data.
    if ((await LinksCollection.find().countAsync()) === 0) {
        await insertLink({
            title: 'Do the Tutorial',
            url: 'https://vuejs.org/guide/quick-start.html',
        })
        
        await insertLink({
            title: 'Follow the Guide',
            url: 'https://guide.meteor.com',
        })
        
        await insertLink({
            title: 'Read the Docs',
            url: 'https://docs.meteor.com',
        })
        
        await insertLink({
            title: 'Discussions',
            url: 'https://forums.meteor.com',
        })
    }
})
