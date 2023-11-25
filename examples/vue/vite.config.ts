import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
  plugins: [
    vue(),
    meteor({
      clientEntry: 'imports/ui/main.ts',
      stubValidation: {
        warnOnly: true,
      }
    }),
  ],
  optimizeDeps: {
    exclude: [
        'ts-minitest',
    ]
  },
})
