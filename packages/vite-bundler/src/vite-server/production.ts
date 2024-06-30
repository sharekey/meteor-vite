import FS from 'fs';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import Path from 'path';
import Util from 'util';
import { DevConnectionLog } from '../loading/vite-connection-handler';
import { cwd } from '../workers';
import { BoilerplateWorker } from './common';

export class ProductionViteBoilerplateWorker extends BoilerplateWorker {
    
    constructor() {
        super();
    }
    
    public async getBoilerplate() {
        return {
            dynamicHead: this.dynamicHead,
            dynamicBody: ''
        };
    }
    
    protected get dynamicHead() {
        const imports = this.imports;
        const lines = [];
        function filePath(file: string) {
            return `/vite-assets/${file}`;
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
    
    protected get viteManifest(): ViteManifest {
        if (Meteor.settings.vite?.manifest) {
            return Meteor.settings.vite.manifest;
        }
        const viteManifestInfo = WebApp.clientPrograms['web.browser'].manifest.find(({ path }: MeteorProgramManifest) => path.endsWith('manifest.json'));
        if (!viteManifestInfo) {
            throw new Error('Could not find Vite manifest in Meteor client program manifest');
        }
        const viteManifestPath = Path.join(cwd, 'programs', 'web.browser', viteManifestInfo.path);
        const manifest = JSON.parse(FS.readFileSync(viteManifestPath, 'utf8'));
        Meteor.settings.vite = { manifest };
        return manifest;
    }
    
    
    protected get imports(): ManifestImports {
        const manifest = this.viteManifest;
        const stylesheets: string[] = [];
        const modules: string[] = [];
        const modulePreload: string[] = [];
        
        function preloadImports(imports: string[]) {
            for (const path of imports) {
                const chunk = manifest[path];
                if (!chunk) {
                    continue;
                }
                modulePreload.push(chunk.file);
                stylesheets.push(...chunk.css || []);
                preloadImports(chunk.imports || []);
            }
            
        }
        
        for (const [name, chunk] of Object.entries(manifest)) {
            if (!chunk.isEntry) {
                continue;
            }
            
            if (chunk.file.endsWith('.js')) {
                modules.push(chunk.file);
            }
            
            if (chunk.file.endsWith('.css')) {
                stylesheets.push(chunk.file);
            }
            
            preloadImports(chunk.imports || []);
            
            stylesheets.push(...chunk.css || []);
        }
        
        DevConnectionLog.debug('Parsed Vite manifest imports', {
            imports: {
                stylesheets,
                modules,
                modulePreload,
            },
            manifest: Util.inspect(manifest, { depth: 4, colors: true })
        })
        
        return {
            stylesheets,
            modules,
            modulePreload,
        }
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
    stylesheets: string[];
    modules: string[];
    modulePreload: string[];
}