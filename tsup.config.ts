import { defineConfig } from 'tsup';

export default defineConfig({
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
})