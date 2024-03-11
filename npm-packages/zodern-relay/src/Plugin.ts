import { Plugin } from 'vite';

const sourceModule = 'meteor/zodern:relay';
const virtualModule = `zodern:relay`;

export default async function zodernRelay(): Promise<Plugin> {
    return {
        name: 'zodern-relay',
        resolveId(id) {
            if (!id.startsWith(sourceModule)) {
                return;
            }
            return `\0${virtualModule}`;
        },
        load(id) {
            if (!id.startsWith(`\0${virtualModule}`)) {
                return;
            }
            
            // todo: load and emit stub file
        }
    }
}