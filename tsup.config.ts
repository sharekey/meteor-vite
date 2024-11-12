import pc from 'picocolors';
import { defineConfig, type Options } from 'tsup';

type Plugin = Required<Options>['esbuildPlugins'][number];

export default defineConfig(() => ({
    entry: {
        server: './packages/vite/src/server.ts',
        build: './packages/vite/src/build.ts',
    },
    outDir: './packages/vite/dist',
    skipNodeModulesBundle: true,
    splitting: false,
    target: 'es2022',
    platform: 'node',
    sourcemap: true,
    format: 'esm',
    esbuildPlugins: [
        EsbuildPluginMeteorStubs
    ]
}))

export const EsbuildPluginMeteorStubs = meteorImportStubs({
    'meteor': () => 'export const Meteor = PackageStub.Meteor || globalThis.Meteor',
    'webapp': () => 'export const WebApp = PackageStub.WebApp || globalThis.WebApp',
})

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
                        const PackageStub = Package[${JSON.stringify(packageName)}];
                        ${stubFunction()}
                    `
                }
            })
        }
    } satisfies Plugin;
}