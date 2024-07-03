import FS from 'fs';
import type { TransformedViteManifest } from 'meteor-vite/meteor/IPC/methods/build';
import { Meteor } from 'meteor/meteor';
import { WebApp, WebAppInternals } from 'meteor/webapp';
import Path from 'path';
import Util from 'util';
import { DevConnectionLog } from '../loading/vite-connection-handler';
import { ROOT_URL, VITE_ASSETS_BASE_URL, VITE_ASSETS_DIR } from '../utility/Helpers';
import { type Boilerplate, ViteBoilerplate } from './common';

export class ViteProductionBoilerplate extends ViteBoilerplate {
    
    constructor() {
        super();
    }
    
    public get assetDir() {
        return '/' + this.viteManifest.assetsDir.replace(/^\/+/, '');
    }
    
    public get baseUrl() {
        return this.viteManifest.base + this.assetDir;
    }
    
    public getBoilerplate(): Boilerplate {
        return {
            dynamicHead: this.dynamicHead,
            dynamicBody: ''
        };
    }
    
    protected get dynamicHead() {
        const imports = this.imports;
        const lines = [];
        function filePath(file: string) {
            const baseUrl = VITE_ASSETS_BASE_URL || ROOT_URL || '';
            
            return `${baseUrl.replace(/\/?$/, '')}/${file}`
        }
        
        for (const file of imports.stylesheets) {
            lines.push(`<link rel="stylesheet" href="${filePath(file)}">`);
        }
        
        for (const file of imports.modules) {
            lines.push(`<script type="module" src="${filePath(file)}"></script>`);
        }
        
        for (const file of imports.modulePreload) {
            lines.push(`<link rel="modulepreload" href="${filePath(file)}">`);
        }
        
        return lines.join('\n');
    }
    
    public get viteManifest(): TransformedViteManifest {
        if (Meteor.settings.vite?.manifest) {
            return Meteor.settings.vite.manifest;
        }
        
        // Search Meteor's program.json file for Vite's manifest.json file
        const viteManifestInfo = WebApp.clientPrograms['web.browser'].manifest.find(({ path }: MeteorProgramManifest) => path.endsWith('vite-manifest.json'));
        if (!viteManifestInfo) {
            throw new Error('Could not find Vite manifest in Meteor client program manifest');
        }
        
        // Read and cache the contents of the vite manifest.json file.
        const viteManifestPath = Path.join(__meteor_bootstrap__.serverDir, '..', 'web.browser', viteManifestInfo.path);
        const manifest = JSON.parse(FS.readFileSync(viteManifestPath, 'utf8'));
        Meteor.settings.vite = { manifest };
        
        return manifest;
    }
    
    /**
     * Mark assets built by Vite as cacheable in Meteor's program.json file for both legacy and modern browsers.
     * Because of the way Meteor handles non-cacheable assets, headers are added that make it tricky to cache with
     * a standard reverse proxy config. You would have to explicitly override the caching headers for all files served
     * by meteor at /vite-assets.
     *
     * The default behavior of Meteor would be to set a max-age header of 0. Which would of course result in a lot of
     * load being put on both your clients and your server.
     */
    public makeViteAssetsCacheable() {
        const archs = ['web.browser', 'web.browser.legacy'];
        
        for (const arch of archs) {
            const clientDir = Path.join(
                __meteor_bootstrap__.serverDir,
                '..',
                arch
            );
            
            // Parse the Meteor program.json file for the current arch.
            const manifestPath = Path.join(clientDir, 'program.json');
            const program = JSON.parse(FS.readFileSync(manifestPath, 'utf8'));
            
            // Override cacheable flag for any assets built by Vite.
            // Meteor will by default set this to false for asset files.
            program.manifest.forEach((file: MeteorProgramManifest) => {
                if (!file.url?.startsWith(`/${VITE_ASSETS_DIR}/`)) {
                    return;
                }
                if (file.url.endsWith('.js')) {
                    file.cacheable = true;
                }
                if (file.url.endsWith('.css')) {
                    file.cacheable = true;
                }
            });
            
            // Write changes to client program.
            FS.writeFileSync(manifestPath, JSON.stringify(program, null, 2));
        }
        
        WebAppInternals.reloadClientPrograms();
    }
    
    
    protected get imports(): ManifestImports {
        if (Meteor.settings.vite?.imports) {
            return Meteor.settings.vite.imports;
        }
        
        const manifest = this.viteManifest;
        const stylesheets = new Set<string>()
        const modules = new Set<string>()
        const modulePreload = new Set<string>();
        
        function preloadImports(imports: string[]) {
            for (const path of imports) {
                const chunk = manifest.files[path];
                if (!chunk) {
                    continue;
                }
                if (modulePreload.has(chunk.file)) {
                    continue;
                }
                modulePreload.add(chunk.file);
                chunk.css?.forEach(css => stylesheets.add(css));
                preloadImports(chunk.imports || []);
            }
            
        }
        
        for (const [name, chunk] of Object.entries(manifest.files)) {
            if (!chunk.isEntry) {
                continue;
            }
            
            if (chunk.file.endsWith('.js')) {
                modules.add(chunk.file);
            }
            
            if (chunk.file.endsWith('.css')) {
                stylesheets.add(chunk.file);
            }
            
            preloadImports(chunk.imports || []);
            
            chunk.css?.forEach(css => stylesheets.add(css));
        }
        
        const imports = {
            stylesheets,
            modules,
            modulePreload,
        }
        
        DevConnectionLog.debug('Parsed Vite manifest imports', Util.inspect({
            imports,
            manifest,
        }, { depth: 4, colors: true }));
        
        Object.assign(Meteor.settings.vite, { imports });
        
        return imports;
    }
}

interface MeteorProgramManifest {
    path: string;
    url?: string;
    cacheable: boolean;
}

interface ManifestImports {
    stylesheets: Set<string>;
    modules: Set<string>;
    modulePreload: Set<string>;
}