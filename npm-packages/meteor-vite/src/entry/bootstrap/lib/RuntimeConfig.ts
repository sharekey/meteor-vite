import { Meteor } from 'meteor/meteor';

interface BoilerplateData {
    head?: string[];
    body?: string[];
}

const BOILERPLATE: BoilerplateData = {
    head: [] as string[],
    body: [] as string[],
}

export async function setBoilerplate(config: BoilerplateData) {
    Object.assign(BOILERPLATE, config);
}

export async function getBoilerplate(): Promise<BoilerplateData> {
    if (Meteor.isServer) {
        return BOILERPLATE;
    }
    
    return Meteor.callAsync('_meteor-vite.getBoilerplate');
}

Meteor.startup(async () => {
    Meteor.methods({
        '_meteor-vite.getBoilerplate'() {
            return getBoilerplate();
        }
    })
})