import { meteor } from 'meteor-vite/plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        meteor({
            clientEntry: 'client/vite-entry.ts',
        }),
    ],
    optimizeDeps: {},
})
