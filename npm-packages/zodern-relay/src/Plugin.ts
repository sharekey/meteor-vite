import type { Plugin } from 'vite';

const sourceModule = 'meteor/zodern:relay';
const virtualModule = `zodern:relay`;
function stubModule(fileName: string) {
    return `@meteor-vite/zodern-relay/stubs/${fileName}`
}

export default async function zodernRelay(): Promise<Plugin> {
    return {
        name: 'zodern-relay',
        resolveId(id) {
            if (!id.startsWith(sourceModule)) {
                return;
            }
            return stubModule('relay-client');
        },
    }
}
