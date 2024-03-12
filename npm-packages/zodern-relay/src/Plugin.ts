import type { Plugin } from 'vite';

const sourceModule = 'meteor/zodern:relay';
const stubModule = '@meteor-vite/zodern-relay/stubs/relay-client';
const defaultOptions: Options = {
    publicationDirectories: [
        './imports/publications',
    ],
    methodDirectories: [
        './imports/methods',
    ],
}

export default async function zodernRelay({
    publicationDirectories = [...defaultOptions.publicationDirectories],
    methodDirectories = [...defaultOptions.methodDirectories],
}: Options = defaultOptions): Promise<Plugin> {
    
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

export interface Options {
    /**
     * Path to directories where your zodern:relay methods live
     * @default
     * publicationDirectories: ['./imports/methods']
     */
    methodDirectories: string[];
    
    /**
     * Path to the directories where your zodern:relay publications live.
     * @default
     * publicationDirectories: ['./imports/publications']
     */
    publicationDirectories: string[];
}