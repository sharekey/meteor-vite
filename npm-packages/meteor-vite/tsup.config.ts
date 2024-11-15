import FS from 'fs';
import Path from 'path';
import { defineConfig } from 'tsup';
import { EsbuildPluginMeteorStubs } from '../../tsup.config';

export default defineConfig([
    // Internal entry points
    {
        name: 'internals',
        entry: [
            './src/bin/worker.ts',
            './src/client/index.ts',
            './src/bootstrap/index.ts',
            './src/bootstrap/HMRServerCleanup.ts',
            './src/bootstrap/ProductionEnvironment.ts',
        ],
        outDir: 'dist',
        format: 'esm',
        sourcemap: true,
        keepNames: true,
        dts: false,
        onSuccess: async () => {
            try {
                const atmospherePackageOutDir = Path.join(__dirname, '..', '..', 'packages', 'vite', 'src');
                FS.writeFileSync(Path.join(atmospherePackageOutDir, '.force-reload-watchfile.ts'), `
 export default 'Forcing reload ${new Date()}'`);
            } catch (error) {
                console.warn(error);
            }
        },
        noExternal: ['meteor'],
        esbuildPlugins: [
            EsbuildPluginMeteorStubs,
        ]
    },
    
    // Plugin entry
    {
        name: 'plugin',
        entry: [
            './src/plugin/index.ts',
        ],
        outDir: 'dist/plugin',
        format: [
            'cjs',
            'esm',
        ],
        sourcemap: true,
        keepNames: true,
        dts: true,
    },
]);