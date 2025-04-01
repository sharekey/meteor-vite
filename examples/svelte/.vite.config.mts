import { svelte } from '@sveltejs/vite-plugin-svelte';
import { meteor } from 'meteor-vite/plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    svelte({
      configFile: 'svelte.config.mjs'
    }),
    meteor({
        clientEntry: 'imports/ui/entry-vite.ts',
        stubValidation: {
          warnOnly: true,
        }
    })
  ],
})
