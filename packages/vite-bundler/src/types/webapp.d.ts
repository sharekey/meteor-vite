import type HTTP from 'http';
import * as Connect from 'connect';

declare module 'meteor/webapp' {
    import { StaticFiles } from 'meteor/webapp';
    namespace WebAppInternals {
        interface BoilerplateData {
            dynamicHead?: string;
            dynamicBody?: string;
            additionalStaticJs: [contents: string, pathname: string][];
            inline?: string;
        }
        
        const staticFilesByArch: {
            'web.browser'?: StaticFiles;
            'web.browser.legacy'?: StaticFiles;
        }
        
        function registerBoilerplateDataCallback(id: string, callback: (request: HTTP.IncomingMessage, data: BoilerplateData) => void): void
    }
    
    namespace WebApp {
        const handlers: Connect.Server;
    }
}

export {}