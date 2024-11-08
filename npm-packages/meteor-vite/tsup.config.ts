import { defineConfig } from 'tsup';

export default defineConfig([
    // Internal entry points
    {
        entry: [
            './src/bin/worker.ts',
            './src/client/index.ts',
            './src/bootstrap/index.ts',
        ],
        outDir: 'dist',
        format: 'esm',
        sourcemap: true,
        dts: false,
    },
    
    // Plugin entry
    {
        entry: [
            './src/plugin/index.ts',
        ],
        outDir: 'dist/plugin',
        format: [
            'cjs',
            'esm',
        ],
        sourcemap: true,
        dts: true,
    },
]);