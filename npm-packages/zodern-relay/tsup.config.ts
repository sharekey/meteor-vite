import { defineConfig } from 'tsup';

export default defineConfig({
    target: 'node',
    outDir: 'dist',
    entry: ['src/Plugin.ts'],
    format: ['cjs', 'esm'],
    skipNodeModulesBundle: true,
})