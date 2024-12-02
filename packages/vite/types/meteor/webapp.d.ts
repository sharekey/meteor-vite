import type HTTP from 'http';
import type * as Connect from 'connect';
import { StaticFiles } from 'meteor/webapp';

declare module 'meteor/webapp' {
    namespace WebAppInternals {
        interface BoilerplateData {
            additionalStaticJs: [contents: string, pathname: string][];
            css: string[];
            js: {
                url: string;
                sri: string;
            }[];
            head: string;
            body: string;
            meteorManifest: string;
            meteorRuntimeConfig: string;
            meteorRuntimeHash: string;
            rootUrlPathPrefix: string;
            bundledJsCssUrlRewriteHook: Function;
            sriMode: undefined;
            inlineScriptsAllowed: boolean;
            inline: undefined;
            htmlAttributes: Record<string, unknown>;
            dynamicHead: string | undefined;
            dynamicBody: string | undefined;
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
