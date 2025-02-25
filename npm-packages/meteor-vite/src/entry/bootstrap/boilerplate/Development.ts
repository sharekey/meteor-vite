import { Meteor } from 'meteor/meteor';
import Path from 'path';
import { type Boilerplate, ViteBoilerplate } from './Boilerplate';

export class ViteDevelopmentBoilerplate extends ViteBoilerplate {
    public readonly baseUrl: string;
    public readonly needsReactPreamble: boolean;
    public readonly clientEntry: string;
    
    constructor({ clientEntry, needsReactPreamble, baseUrl }: Pick<ViteDevelopmentBoilerplate, 'baseUrl' | 'needsReactPreamble' | 'clientEntry'>) {
        super();
        this.clientEntry = clientEntry;
        this.needsReactPreamble = needsReactPreamble;
        this.baseUrl = baseUrl;
        
        if (!baseUrl) {
            throw new Error('Unable to resolve base URL for Vite assets! Make sure you are importing meteor-vite as a plugin your Vite config');
        }
    }
    
    public getBoilerplate(): Boilerplate {
        // ⚡ [Client] Prepare module import scripts for the Meteor app HTML.
        const scripts = [
            Path.join(this.baseUrl, '@vite/client'),
            Path.join(this.baseUrl, this.clientEntry)
        ].map((url) => {
            let absoluteUrl = url.replaceAll(Path.win32.sep, Path.posix.sep);
            
            if (!absoluteUrl.match(/https?:/)) {
                absoluteUrl = Meteor.absoluteUrl(url)
            }
            
            return `<script src="${absoluteUrl}" type="module" crossorigin></script>`;
        });
        
        // ⚡ [Client/React] Add React HMR preamble
        if (this.needsReactPreamble) {
            scripts.unshift(`
                <script type="module">
                    import RefreshRuntime from "${Meteor.absoluteUrl(Path.join(this.baseUrl, '@react-refresh'))}"
                    RefreshRuntime.injectIntoGlobalHook(window)
                    window.$RefreshReg$ = () => {}
                    window.$RefreshSig$ = () => (type) => type
                    window.__vite_plugin_react_preamble_installed__ = true
                </script>
            `)
        }
        
        return {
            dynamicHead: scripts.join('\n'),
            dynamicBody: '',
        }
    }
}