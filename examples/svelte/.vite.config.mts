import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    svelte({
      configFile: 'svelte.config.mjs'
    })
  ],

  meteor: {
    clientEntry: 'imports/ui/main.ts',
    stubValidation: {
      warnOnly: true,
    }
  },
})
