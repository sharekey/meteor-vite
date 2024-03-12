import FS from 'fs';
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
    const packageJson: {
        meteor: {
            mainModule: {
                client: string;
            }
        }
    } = JSON.parse(FS.readFileSync(Path.join(cwd, 'package.json'), 'utf-8'));
    const relayImportsFilename = '__relay-imports.js';
    const clientMainModule = Path.resolve(packageJson.meteor.mainModule.client);
    const clientRootDir = Path.dirname(clientMainModule);
    const relayImportsModule = Path.join(clientRootDir, relayImportsFilename);
    
    
    // Prepare relay imports module
    // This prevents Meteor from omitting exported publications/methods from zodern:relay
    {
        if (!FS.existsSync(relayImportsModule)) {
            FS.writeFileSync(relayImportsModule, `// zodern:relay imports - added by Vite (You should commit this file)`);
        }
        const mainModuleContent = FS.readFileSync(clientMainModule, 'utf-8');
        const importPath = Path.relative(clientRootDir, relayImportsFilename);
        if (!mainModuleContent.includes(relayImportsFilename)) {
            FS.writeFileSync(clientMainModule, `import ${JSON.stringify(importPath)}\n${mainModuleContent}`);
        }
    }
    
    function addRelayImport(relay: RelayInfo) {
        const importPath = Path.relative(clientMainModule, relay.relativePath);
        const existingContent = FS.readFileSync(relayImportsModule, 'utf-8');
        const lines = existingContent.split(/[\r\n]+/);
        for (const line of lines) {
            if (line.includes(importPath)) {
                return;
            }
        }
        lines.push(`import ${JSON.stringify(importPath)}`);
        FS.writeFileSync(relayImportsModule, lines.join('\n'));
    }
    
    type RelayInfo = {
        type: 'methods' | 'publications';
        id: string;
        relativePath: string;
    };
    
    function resolveRelay(id: string): RelayInfo | undefined {
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
            
            addRelayImport(relay);
            
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