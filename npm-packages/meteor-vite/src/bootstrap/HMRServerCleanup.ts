/// <reference types="vite/client" />
import { Meteor } from 'meteor/meteor';
import pc from 'picocolors';
import PackageJson from '../../package.json';



if (import.meta.hot) {
    // Initial handles
    // Todo: refactor to use stubs for tracking methods and publications created by the server entry.
    const { method_handlers, publish_handlers } = Meteor.server;
    await new Promise<void>((resolve) => {
        Meteor.startup(() => {
            Object.assign(method_handlers, Meteor.server.method_handlers)
            Object.assign(publish_handlers, Meteor.server.publish_handlers);
            console.log({ method_handlers, publish_handlers })
            resolve()
        });
    })
    
    import.meta.hot.on('vite:beforeFullReload', () => {
        const countPersisted = {
            methods: Object.keys(method_handlers).length,
            publications: Object.keys(publish_handlers).length,
        }
        const count = {
            methodHandles: pc.yellow(
                (Object.keys(Meteor.server.method_handlers).length - countPersisted.methods).toLocaleString()
            ),
            publishHandlers: pc.yellow(
                (Object.keys(Meteor.server.publish_handlers).length - countPersisted.publications).toLocaleString()
            ),
        }
        Meteor.server.method_handlers = Object.assign({}, method_handlers);
        Meteor.server.publish_handlers = Object.assign({}, publish_handlers);
        console.info([
            `[${pc.cyan('HMR')}] Cleaned up ${count.methodHandles} method and ${count.publishHandlers} publish handlers`,
            [
                `${pc.yellow(countPersisted.methods)} methods and ${pc.yellow(countPersisted.publications)} publications were retained.`,
                'If there are other resources that persist after hot-reloading,',
                'please open an issue over on GitHub so we can have that taken care of.',
            ].map((line) => `${pc.dim('L')}   ${line}`),
            
            `🐛  ${pc.blue(PackageJson.bugs.url)}`
            
        ].flat().join('\n') + '\n\n');
    })
}
