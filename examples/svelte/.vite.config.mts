import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
  plugins: [
    svelte({
      configFile: 'svelte.config.mjs'
    }),
    meteor({
        clientEntry: 'imports/ui/main.ts',
        stubValidation: {
          warnOnly: true,
        }
    })
  ],
})
