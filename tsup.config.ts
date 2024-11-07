import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
      server: './packages/vite/src/server.ts'
    },
    outDir: './packages/vite/dist',
    skipNodeModulesBundle: true,
    target: 'es2022',
    platform: 'node',
    sourcemap: true,
    format: 'esm',
})