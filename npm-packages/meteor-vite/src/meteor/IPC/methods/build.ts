import Path from 'path';
import { RollupOutput } from 'rollup';
import { build, InlineConfig, resolveConfig } from 'vite';
import MeteorVitePackage from '../../../../package.json';
import { meteorWorker } from '../../../plugin/Meteor';
import {
    type MeteorStubsSettings,
    type ProjectJson,
    type ResolvedMeteorViteConfig,
} from '../../../VitePluginSettings';
import { MeteorServerBuilder } from '../../ServerBuilder';
import { defineIpcMethods } from '../interface';
import { IPC } from '../transports/Transport';

type BuildOutput = Awaited<ReturnType<typeof build>>;

export default defineIpcMethods({
    async'vite.build'(buildConfig: BuildOptions) {
        try {
            const { viteConfig, inlineBuildConfig, outDir } = await prepareConfig(buildConfig);
            const results = await build(inlineBuildConfig);
            if (viteConfig.meteor?.serverEntry) {
                await MeteorServerBuilder({ packageJson: buildConfig.packageJson, watch: false });
            }
            const result = Array.isArray(results) ? results[0] : results;
            validateOutput(result);
            
            // Result payload
            await IPC.reply({
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
            await IPC.reply({
                kind: 'buildResult',
                data: {
                    payload: {
                        success: false
                    },
                }
            })
            throw error;
        }
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

    const viteConfig: ResolvedMeteorViteConfig = await resolveConfig({
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
                        chunkFileNames: viteConfig.meteor.chunkFileNames ?? '[name]-[hash:12].js',
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

function validateOutput(rollupResult?: BuildOutput | RollupOutput): asserts rollupResult is RollupOutput {
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

type ParsedConfig = {
    viteConfig: ResolvedMeteorViteConfig;
    inlineBuildConfig: InlineConfig;
    outDir: string;
}


