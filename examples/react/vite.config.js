import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { meteor } from '../../npm-packages/meteor-vite/src/plugin';

export default defineConfig({
  plugins: [
      react(),
      meteor({
        clientEntry: "imports/vite-entrypoint.jsx",
        externalizeNpmPackages: ['react', 'react-dom'],
        stubValidation: {
          warnOnly: true,
          ignoreDuplicateExportsInPackages: ['react', 'react-dom'],
        },
        meteorStubs: {
          debug: false
        },
      })
  ],
});
