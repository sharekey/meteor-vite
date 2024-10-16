import type HTTP from 'http';
import { fetch } from 'meteor/fetch';
import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';
import {
    DevConnectionLog,
    getConfig,
    MeteorViteConfig,
    setConfig,
    ViteConnection,
    ViteDevScripts,
} from './loading/vite-connection-handler';
import { getMeteorRuntimeConfig } from './utility/Helpers';
import { createWorkerFork, getProjectPackageJson, isMeteorIPCMessage } from './workers';

if (Meteor.isDevelopment) {
    DevConnectionLog.info('Starting Vite server...');
    
    WebAppInternals.registerBoilerplateDataCallback('meteor-vite', async (request: HTTP.IncomingMessage, data: BoilerplateData) => {
        const scripts = new ViteDevScripts(await getConfig());
        data.dynamicBody = `${data.dynamicBody || ''}\n${await scripts.stringTemplate()}`;
    });
    
    const viteServer = createWorkerFork({
        async viteConfig(config) {
            const { ready } = await setConfig(config);
            if (ready) {
                DevConnectionLog.info(`Meteor-Vite ready for connections!`)
            }
        },
        refreshNeeded() {
            DevConnectionLog.info('Some lazy-loaded packages were imported, please refresh')
        },
    }, { detached: true });
    
    viteServer.call({
        method: 'vite.server.start',
        params: [{
            packageJson: getProjectPackageJson(),
            meteorParentPid: process.ppid,
            meteorConfig: getMeteorRuntimeConfig(),
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
