/// <reference types="vite/client" />
import { Meteor } from 'meteor/meteor';
import pc from 'picocolors';
import PackageJson from '../../package.json';

if (import.meta.hot) {
    import.meta.hot.on('vite:beforeFullReload', () => {
        Meteor.server.method_handlers = {};
        Meteor.server.publish_handlers = {};
        console.info([
            `[${pc.cyan('HMR')}] Cleaned up Meteor method and publish handles`,
            pc.dim([
                'If there are other resources that persist after hot-reloading,',
                'please open an issue over on GitHub so we can have that taken care of.',
                `🐛 ${pc.blue(PackageJson.bugs.url)}`
            ].join('\n'))
        ].join('\n')
        );
    })
}
