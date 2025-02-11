import pc from 'picocolors';
import { defineConfig, type Options } from 'tsup';

type Plugin = Required<Options>['esbuildPlugins'][number];

export default defineConfig(() => ({
    name: 'jorgenvatle:vite',
    entry: [
        './packages/vite/src/entry/server-runtime.ts',
        './packages/vite/src/entry/client-runtime.ts',
        './packages/vite/src/entry/build-plugin.ts'
    ],
    outDir: './packages/vite/dist',
    skipNodeModulesBundle: true,
    splitting: false,
    target: 'es2022',
    platform: 'node',
    keepNames: false,
    minify: false,
    sourcemap: true,
    format: 'esm',
    noExternal: ['meteor'],
    esbuildPlugins: [
        EsbuildPluginMeteorStubs
    ]
}))

export const EsbuildPluginMeteorStubs = meteorImportStubs({
    'meteor': (symbol) => `export const Meteor = ${symbol}?.Meteor || globalThis.Meteor`,
    'mongo': (symbol) => `export const { Mongo } = ${symbol} || {}`,
    'isobuild': () => `const PluginGlobal = Plugin; export { PluginGlobal as Plugin }`,
    'server-render': (symbol) => `export const { onPageLoad } = ${symbol} || {}`,
    'webapp': (symbol) => [
        `export const WebApp = ${symbol}?.WebApp || globalThis.WebApp`,
        `export const WebAppInternals = ${symbol}?.WebAppInternals || globalThis?.WebAppInternals`,
    ].join('\n'),
})

function meteorImportStubs(packages: {
    [key in string]: (symbol: string) => string;
}): Plugin {
    const filter = /^meteor\//;
    let stubId = 0;
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
                
                const stubSymbol = `PackageStub_${stubId++}`;
                return {
                    contents: `
                        const ${stubSymbol} = globalThis.Package?.[${JSON.stringify(packageName)}];
                        ${stubFunction(stubSymbol)}
                    `
                }
            })
        }
    } satisfies Plugin;
}