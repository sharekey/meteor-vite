import { fetch } from 'meteor/fetch';
import { Meteor } from 'meteor/meteor';
import {
    DevConnectionLog,
    getConfig,
    MeteorViteConfig,
    setConfig,
    ViteConnection, ViteDevScripts,
} from '../loading/vite-connection-handler';
import { createWorkerFork, getProjectPackageJson, isMeteorIPCMessage, type WorkerInstance } from '../workers';
import { BoilerplateWorker } from './common';


export class ViteDevServerWorker extends BoilerplateWorker {
    protected readonly viteServer: WorkerInstance;
    protected tsupWatcherRunning = false;
    constructor() {
        super();
        const viteServer = this.viteServer = createWorkerFork({
            async viteConfig(config) {
                const { ready } = await setConfig(config);
                if (ready) {
                    DevConnectionLog.info(`Meteor-Vite ready for connections!`)
                }
            },
            
            refreshNeeded() {
                DevConnectionLog.info('Some lazy-loaded packages were imported, please refresh')
            },
            
            /**
             * Builds the 'meteor-vite' npm package where the worker and Vite server is kept.
             * Primarily to ease the testing process for the Vite plugin.
             */
            workerConfig: ({ listening }) => {
                if (!listening) return;
                if (process.env.METEOR_VITE_TSUP_BUILD_WATCHER !== 'true') return;
                if (this.tsupWatcherRunning) return;
                
                this.tsupWatcherRunning = true;
                viteServer.call({
                    method: 'tsup.watch.meteor-vite',
                    params: [],
                })
            }
        }, { detached: true });
        
        Meteor.publish(ViteConnection.publication, () => {
            return MeteorViteConfig.find(ViteConnection.configSelector);
        });
        
        Meteor.methods({
            [ViteConnection.methods.refreshConfig]() {
                DevConnectionLog.info('Refreshing configuration from Vite dev server...')
                viteServer.call({
                    method: 'vite.server.getConfig',
                    params: [],
                });
                return getConfig();
            }
        });
    }
    
    public start() {
        DevConnectionLog.info('Starting Vite server...');
        
        this.viteServer.call({
            method: 'vite.server.start',
            params: [{
                packageJson: getProjectPackageJson(),
                meteorParentPid: process.ppid,
            }]
        });
        
        // Forward IPC messages from the `meteor-tool` parent process to the Vite server
        // Used to notify our Vite build plugin of things like the client bundle or Atmosphere packages being rebuilt.
        process.on('message', async (message) => {
            if (!isMeteorIPCMessage(message)) return;
            const { baseUrl, ready } = await getConfig();
            if (!ready) return;
            
            await fetch(`${baseUrl}/__meteor__/ipc-message`, {
                method: 'POST',
                body: JSON.stringify(message),
            }).catch((error) => {
                console.error(error);
            })
        })
    }
    
    public async getBoilerplate() {
        const scripts = new ViteDevScripts(await getConfig());
        
        return {
            dynamicBody: await scripts.stringTemplate(),
        }
    }
}