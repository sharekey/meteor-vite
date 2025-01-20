import type { Plugin } from 'esbuild';
import { defineConfig } from 'tsup';
import pc from 'picocolors';

export default defineConfig({
    entry: ['index.js', "suspense/index.js"],
    outDir: 'dist',
    format: ['esm', 'cjs'],
    external: ['meteor/meteor', 'meteor/mongo', 'meteor/tracker'],
    esbuildPlugins: [
        meteorImportStubs({
            'ejson': () => 'export const EJSON = PackageStub.EJSON || globalThis.EJSON',
        }),
    ]
});

function meteorImportStubs(packages: {
    [key in string]: () => string;
}): Plugin {
    const filter = /^meteor\//;
    return {
        name: 'meteor-import-stubs',
        setup(build) {
            build.onResolve({ filter }, (args) => {
                return { path: args.path.replace(filter, '') , namespace: 'meteor' }
            })
            
            build.onLoad({ filter: /.*/, namespace: 'meteor' }, (args) => {
                console.log(pc.cyan(`Stubbing Meteor package import: '${pc.green(args.path)}'`));
                
                const [packageName] = args.path.split('/');
                const stubFunction = packages[packageName];
                
                if (!stubFunction) {
                    throw new Error('Meteor package is missing stubs: ' + pc.yellow(args.path));
                }
                
                return {
                    contents: `
                        const PackageStub = Package?.[${JSON.stringify(packageName)}] || {};
                        ${stubFunction()}
                    `
                }
            })
        }
    } satisfies Plugin;
}