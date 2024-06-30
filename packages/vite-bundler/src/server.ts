import HTTP from 'http';
import { WebAppInternals } from 'meteor/webapp';
import type { BoilerplateData } from './common';
import { ViteDevServerWorker } from './development';
import { ProductionViteBoilerplateWorker } from './production';

const worker = Meteor.isProduction ? new ProductionViteBoilerplateWorker()
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
})