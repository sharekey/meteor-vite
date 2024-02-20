import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
  plugins: [
      react(),
      meteor({
        clientEntry: "imports/vite-entrypoint.jsx",
        stubValidation: {
          warnOnly: true,
        },
        meteorStubs: {
          debug: false
        },
      })
  ],
    optimizeDeps: {
      exclude: ['@meteor-vite/react-meteor-data'],
    }
});
