import { transformAsync } from '@babel/core';
import FS from 'fs';
import Path from 'path';
import { type Plugin } from 'vite';

const cwd = process.cwd();

export default async function zodernRelay(options?: Options): Promise<Plugin> {
    const config = {
        directories: {
            methods: options?.directories?.methods || ['./imports/methods'],
            publications: options?.directories?.publications || ['./imports/publications'],
        }
    } satisfies Options;
    
    const directories = [
        ...config.directories.methods.map((path) => ['methods', Path.relative(cwd, path)]),
        ...config.directories.publications.map((path) => ['publications', Path.relative(cwd, path)])
    ] as [RelayInfo['type'], string][];
    
    function resolveRelay(id: string): RelayInfo | undefined {
        const relativePath = Path.relative(cwd, id);
        for (const [type, directory] of directories) {
            if (!relativePath.startsWith(directory)) {
                continue;
            }
            return {
                id,
                type,
                relativePath,
            }
        }
    }
    
    return {
        name: 'zodern-relay',
        async load(filename) {
            const relay = resolveRelay(filename || '');
            if (!relay) {
                return;
            }
            const code = FS.readFileSync(filename, 'utf-8');
            const transform = await transformAsync(code, {
                configFile: false,
                babelrc: false,
                filename,
                plugins: ['@zodern/babel-plugin-meteor-relay'],
                caller: {
                    name: '@meteor-vite/plugin-zodern-relay',
                    
                    // @ts-expect-error No type definition for this, but it's required by the Babel plugin.
                    arch: 'web.browser.vite',
                }
            });
            
            if (!transform) {
                return;
            }
            
            return {
                code: transform.code ?? '',
            }
        }
    }
    
    
}
export interface Options {
    directories?: {
        /**
         * Path to directories where your zodern:relay methods live
         * @default
         * methods: ['./imports/methods']
         */
        methods?: string[],
        
        /**
         * Path to the directories where your zodern:relay publications live.
         * @default
         * publications: ['./imports/publications']
         */
        publications?: string[],
    }
}

type RelayInfo = {
    type: 'methods' | 'publications';
    id: string;
    relativePath: string;
};
