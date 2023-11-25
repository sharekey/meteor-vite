import { Meteor } from 'meteor/meteor'
import { WebAppInternals } from 'meteor/webapp'
import type HTTP from 'http'
import { fetch } from 'meteor/fetch';
import { MeteorIPCMessage } from '../../npm-packages/meteor-vite/src/meteor/IPC/MeteorEvents';
import {
    getConfig, DevConnectionLog,
    MeteorViteConfig,
    setConfig,
    ViteConnection, ViteDevScripts,
} from './loading/vite-connection-handler';
import { createWorkerFork, getProjectPackageJson, isMeteorIPCMessage } from './workers';

if (Meteor.isDevelopment) {
    let tsupWatcherRunning = false;
    DevConnectionLog.info('Starting Vite server...');
    
    WebAppInternals.registerBoilerplateDataCallback('meteor-vite', (request: HTTP.IncomingMessage, data: BoilerplateData) => {
        const scripts = new ViteDevScripts(getConfig());
        data.dynamicBody = `${data.dynamicBody || ''}\n${scripts.stringTemplate()}`;
    });
    
    const viteServer = createWorkerFork({
        viteConfig(config) {
            const { ready } = setConfig(config);
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
        workerConfig({ listening }) {
            if (!listening) return;
            if (process.env.METEOR_VITE_TSUP_BUILD_WATCHER !== 'true') return;
            if (tsupWatcherRunning) return;
            
            tsupWatcherRunning = true;
            viteServer.call({
                method: 'npm.meteor-vite.build',
                params: [],
            })
        }
    }, { detached: true });
    
    const sendIpcMessage = Meteor.bindEnvironment(async (message: MeteorIPCMessage) => {
        const { host, port, ready } = getConfig();
        if (!ready) return;
        
        await fetch(`http://${host}:${port}/__meteor__/ipc-message`, {
            method: 'POST',
            body: JSON.stringify(message),
        }).catch((error) => {
            console.error(error);
        })
    })
    
    
    viteServer.call({
        method: 'vite.server.start',
        params: [{
            packageJson: getProjectPackageJson(),
            meteorParentPid: process.ppid,
        }]
    });
    
    process.on('message', (message) => {
        if (!isMeteorIPCMessage(message)) return;
        sendIpcMessage(message);
    })
    
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
    })
}

interface BoilerplateData {
    dynamicBody?: string;
    additionalStaticJs: [contents: string, pathname: string][];
    inline?: string;
}
