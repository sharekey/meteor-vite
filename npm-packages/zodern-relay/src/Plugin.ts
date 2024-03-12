import Babel from '@babel/core';
import FS from 'fs';
import Path from 'path';
import type { Plugin } from 'vite';

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
    
    const directories = [
        ...methodDirectories.map((path) => ['methods', Path.relative(cwd, path)]),
        ...publicationDirectories.map((path) => ['publications', Path.relative(cwd, path)])
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
            const transform = await Babel.transformAsync(code, {
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

type RelayInfo = {
    type: 'methods' | 'publications';
    id: string;
    relativePath: string;
};
