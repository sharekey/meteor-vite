import type { Plugin } from 'vite';

const sourceModule = 'meteor/zodern:relay';
const stubModule = '@meteor-vite/zodern-relay/stubs/relay-client';

export default async function zodernRelay(): Promise<Plugin> {
    return {
        name: 'zodern-relay',
        resolveId(id) {
            if (!id.startsWith(sourceModule)) {
                return;
            }
            return `\0${id}`;
        },
        load(id) {
            if (!id.startsWith(`\0${sourceModule}`)) {
                return;
            }
            
            // language=typescript
            return `export * from ${JSON.stringify(stubModule)}`;
        }
    }
}
