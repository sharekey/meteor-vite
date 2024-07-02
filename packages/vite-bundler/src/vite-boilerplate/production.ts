import FS from 'fs';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import Path from 'path';
import Util from 'util';
import { DevConnectionLog } from '../loading/vite-connection-handler';
import { ROOT_URL, VITE_ASSETS_BASE_URL } from '../utility/Helpers';
import { type Boilerplate, ViteBoilerplate } from './common';

export class ViteProductionBoilerplate extends ViteBoilerplate {
    
    
    
    constructor() {
        super();
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
    
    public get viteManifest(): ViteManifest {
        if (Meteor.settings.vite?.manifest) {
            return Meteor.settings.vite.manifest;
        }
        const viteManifestInfo = WebApp.clientPrograms['web.browser'].manifest.find(({ path }: MeteorProgramManifest) => path.endsWith('vite-manifest.json'));
        if (!viteManifestInfo) {
            throw new Error('Could not find Vite manifest in Meteor client program manifest');
        }
        const viteManifestPath = Path.join(__meteor_bootstrap__.serverDir, '..', 'web.browser', viteManifestInfo.path);
        const manifest = JSON.parse(FS.readFileSync(viteManifestPath, 'utf8'));
        Meteor.settings.vite = { manifest };
        return manifest;
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
                const chunk = manifest[path];
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
        
        for (const [name, chunk] of Object.entries(manifest)) {
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
}

type ViteManifest = Record<string, ViteChunk>;
interface ViteChunk {
    file: string;
    src: string;
    name?: string;
    isDynamicEntry?: boolean;
    isEntry?: boolean;
    css?: string[];
    imports?: string[];
    dynamicImports?: string[];
}

interface ManifestImports {
    stylesheets: Set<string>;
    modules: Set<string>;
    modulePreload: Set<string>;
}