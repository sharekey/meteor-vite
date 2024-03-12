import Path from 'path';
import type { Plugin } from 'vite';

const sourceModule = 'meteor/zodern:relay';
const stubModule = '@meteor-vite/zodern-relay/stubs/relay-client';
const cwd = process.cwd();
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
    const directories = {
        methods: methodDirectories.map((path) => Path.relative(cwd, path)),
        publications: publicationDirectories.map((path) => Path.relative(cwd, path)),
    }
    
    function resolveRelay(id: string) {
        const relativePath = Path.relative(cwd, id);
        for (const dir of directories.methods) {
            if (!relativePath.startsWith(dir)) {
                continue;
            }
            return {
                id,
                type: 'methods',
                relativePath,
            }
        }
        for (const dir of directories.publications) {
            if (!relativePath.startsWith(dir)) {
                continue;
            }
            return {
                id,
                type: 'publications',
                relativePath,
            }
        }
    }
    
    
    return {
        name: 'zodern-relay',
        resolveId(id) {
            if (!resolveRelay(id)) {
                return;
            }
            return `\0${id}`;
        },
        load(id) {
            const [_, module] = id.split('\0');
            const relay = resolveRelay(module || '');
            if (!relay) {
                return;
            }
            
            // Load target module content
            // Traverse module
            // Get exports
            // Filter out non-zodern:relay exports
            // Track all method/publication name keys
            // Map createPublication/createMethod calls to _createClient<Publication/Method>(<publicationName/methodName>>)
            // Return transformed content
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