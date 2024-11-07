import { defineConfig } from 'tsup';

export default defineConfig({
    skipNodeModulesBundle: true,
    target: 'es2022',
    platform: 'node',
})