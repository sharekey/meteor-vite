import type HTTP from 'http';

declare module 'meteor/webapp' {
    namespace WebAppInternals {
        interface BoilerplateData {
            dynamicHead?: string;
            dynamicBody?: string;
            additionalStaticJs: [contents: string, pathname: string][];
            inline?: string;
        }
        
        function registerBoilerplateDataCallback(id: string, callback: (request: HTTP.IncomingMessage, data: BoilerplateData) => void): void
    }
}

export {}