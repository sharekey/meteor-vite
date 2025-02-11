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

export async function getBoilerplate() {
    return BOILERPLATE;
}

Meteor.startup(async () => {
    Meteor.methods({
        '_meteor-vite.getBoilerplate'() {
            return getBoilerplate();
        }
    })
})