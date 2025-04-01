import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { meteor } from 'meteor-vite/plugin';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
      react({
          jsxRuntime: 'classic'
      }),
      meteor({
        clientEntry: "client/entry-vite.jsx",
        stubValidation: {
          warnOnly: true,
        },
        meteorStubs: {
          debug: false
        },
      }),
      tailwind(),
  ],
    optimizeDeps: {
      exclude: ['@meteor-vite/react-meteor-data'],
    }
});
