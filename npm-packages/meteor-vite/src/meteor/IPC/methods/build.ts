import { spawn } from 'child_process';
import Path from 'path';
import { RollupOutput, RollupWatcher } from 'rollup';
import { build, InlineConfig, resolveConfig } from 'vite';
import MeteorVitePackage from '../../../../package.json';
import { MeteorViteConfig } from '../../../MeteorViteConfig';
import { meteorWorker } from '../../../plugin/Meteor';
import { MeteorStubsSettings, ProjectJson } from '../../../plugin/MeteorStubs';
import CreateIPCInterface, { IPCReply } from '../interface';

export default CreateIPCInterface({
    async 'vite.build'(
        reply: Replies,
        buildConfig: BuildOptions
    ) {
        try {
            const { viteConfig, inlineBuildConfig, outDir } = await prepareConfig(buildConfig);
            const results = await build(inlineBuildConfig);
            const result = Array.isArray(results) ? results[0] : results;
            validateOutput(result);

            // Result payload
            reply({
                kind: 'buildResult',
                data: {
                    payload: {
                        outDir,
                        success: true,
                        meteorViteConfig: viteConfig.meteor,
                        output: result.output.map(o => ({
                            name: o.name,
                            type: o.type,
                            fileName: o.fileName,
                        })),
                    },
                }
            })
        } catch (error) {
            reply({
                kind: 'buildResult',
                data: {
                    payload: {
                        success: false
                    },
                }
            })
            throw error;
        }
    },
    
    /**
     * Internal command for spinning up a watcher to rebuild meteor-vite on changes.
     * Used to ease with the development of this package while running one of the example apps.
     * Controlled through environment variables applied by the example-app.sh utility script.
     */
    async 'tsup.watch.meteor-vite'(reply) {
        const npmPackagePath = Path.join(process.cwd(), '/node_modules/meteor-vite/') // to the meteor-vite npm package
        const tsupPath = Path.join(npmPackagePath, '/node_modules/.bin/tsup-node'); // tsup to 2 node_modules dirs down.
        
        const child = spawn(tsupPath, ['--watch'], {
            stdio: 'inherit',
            cwd: npmPackagePath,
            detached: false,
            env: {
                FORCE_COLOR: '3',
            },
        });
        
        child.on('error', (error) => {
            throw new Error(`meteor-vite package build worker error: ${error.message}`, { cause: error })
        });
        
        child.on('exit', (code) => {
            if (!code) {
                return;
            }
            process.exit(1);
            throw new Error('TSUp watcher exited unexpectedly!');
        });
    }
})

async function prepareConfig(buildConfig: BuildOptions): Promise<ParsedConfig> {
    const { meteor, packageJson } = buildConfig;
    const configFile = buildConfig.packageJson?.meteor?.vite?.configFile
        // Fallback for deprecated config file format
        ?? buildConfig.packageJson?.meteor?.viteConfig;

    Object.entries(buildConfig).forEach(([key, value]) => {
        if (!value) {
            throw new Error(`Vite: Worker missing required build argument "${key}"!`)
        }
    })

    const viteConfig: MeteorViteConfig = await resolveConfig({
        configFile,
        plugins: [
            meteorWorker({}) // Fills in defaults for missing fields.
        ]
    }, 'build');

    if (!viteConfig.meteor?.clientEntry) {
        throw new Error(`You need to specify an entrypoint in your Vite config! See: ${MeteorVitePackage.homepage}`);
    }

    const outDir = Path.join(viteConfig.meteor.tempDir, 'bundle');
    return {
        viteConfig,
        outDir,
        inlineBuildConfig: {
            configFile,
            build: {
                lib: {
                    entry: viteConfig.meteor.clientEntry,
                    formats: ['es'],
                },
                rollupOptions: {
                    output: {
                        entryFileNames: 'meteor-entry.js',
                        chunkFileNames: '[name]-[hash:12].js',
                    },
                },
                outDir,
                minify: false,
            },
            plugins: [
                meteorWorker({
                    meteorStubs: {
                        meteor,
                        packageJson,
                    },
                }),
            ],
        }
    }
}

function validateOutput(rollupResult?: RollupOutput | RollupWatcher): asserts rollupResult is RollupOutput {
    if (!rollupResult) {
        throw new Error('Received no result from Rollup!');
    }

    if ('output' in rollupResult) {
        return;
    }

    const message = 'Unexpected rollup result!';
    console.error(message, rollupResult);
    throw new Error(message);
}

export interface BuildOptions {
    meteor: MeteorStubsSettings['meteor'];
    packageJson: ProjectJson;
}

type Replies = IPCReply<{
    kind: 'buildResult',
    data: {
        payload: {
                     success: true;
                     outDir: string;
                     meteorViteConfig: any,
                     output?: {name?: string, type: string, fileName: string}[]
                 } | {
                     success: false;
                 };
    }
}>

type ParsedConfig = {
    viteConfig: MeteorViteConfig;
    inlineBuildConfig: InlineConfig;
    outDir: string;
}


