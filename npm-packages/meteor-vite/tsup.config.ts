import FS from 'fs';
import Path from 'path';
import { defineConfig } from 'tsup';

export default defineConfig([
    // Internal entry points
    {
        entry: [
            './src/bin/worker.ts',
            './src/client/index.ts',
            './src/bootstrap/index.ts',
            './src/bootstrap/HMRServerCleanup.ts',
        ],
        outDir: 'dist',
        format: 'esm',
        sourcemap: true,
        dts: false,
        onSuccess: async () => {
            try {
                const atmospherePackageOutDir = Path.join(__dirname, '..', '..', 'packages', 'vite', 'dist');
                FS.appendFileSync(Path.join(atmospherePackageOutDir, 'server.mjs'), '\n // Forcing reload');
            } catch (error) {
                console.warn(error);
            }
        }
    },
    
    // Plugin entry
    {
        entry: [
            './src/plugin/index.ts',
        ],
        outDir: 'dist/plugin',
        format: [
            'cjs',
            'esm',
        ],
        sourcemap: true,
        dts: true,
    },
]);