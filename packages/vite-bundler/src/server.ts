import HTTP from 'http';
import { WebApp, WebAppInternals } from 'meteor/webapp';
import { VITE_ASSETS_DIR } from './utility/Helpers';
import Logger from './utility/Logger';
import type { BoilerplateData } from './vite-boilerplate/common';
import { ViteDevServerWorker } from './vite-boilerplate/development';
import { ViteProductionBoilerplate } from './vite-boilerplate/production';

const worker = Meteor.isProduction ? new ViteProductionBoilerplate()
                                   : new ViteDevServerWorker();

if ('start' in worker) {
    Meteor.startup(() => {
        worker.start();
    })
}

WebAppInternals.registerBoilerplateDataCallback('meteor-vite', async (request: HTTP.IncomingMessage, data: BoilerplateData) => {
    const { dynamicBody, dynamicHead } = await worker.getBoilerplate();
    
    if (dynamicHead) {
        data.dynamicHead = `${data.dynamicHead || ''}\n${dynamicHead}`;
    }
    
    if (dynamicBody) {
        data.dynamicBody = `${data.dynamicBody || ''}\n${dynamicBody}`;
    }
});

Meteor.startup(() => {
    if (worker instanceof ViteProductionBoilerplate) {
        Logger.debug(`Vite asset base URL: ${worker.baseUrl}`);
        worker.makeViteAssetsCacheable();
        
        // Prevent Meteor from sending a 200 OK HTML file when the request is clearly not valid.
        // If an asset is found by Meteor, this hook will not be called.
        WebApp.connectHandlers.use(worker.assetDir, (req, res, next) => {
            res.writeHead(404, 'Not found');
            res.write('Vite asset could not be found.')
            Logger.warn(`Served 404 for Vite asset request: ${req.originalUrl}`);
            res.end();
        })
    }
})
