import path from 'node:path';
import { getBuildConfig } from '../utility/Helpers';
import Logger from '../utility/Logger';
import { cwd } from '../workers';
import fs from 'fs-extra';
import { execaSync } from 'execa';

const {
    meteorMainModule,
    packageJson: pkg,
    tempMeteorOutDir,
    tempMeteorProject,
} = getBuildConfig();

/**
 * Build a temporary Meteor project to use for safely building the Vite production bundle to be fed into the Meteor
 * compiler
 */
export function prepareTemporaryMeteorProject() {
    const profile = Logger.startProfiler();
    const filesToCopy = [
        path.join('.meteor', '.finished-upgraders'),
        path.join('.meteor', '.id'),
        path.join('.meteor', 'packages'),
        path.join('.meteor', 'platforms'),
        path.join('.meteor', 'release'),
        path.join('.meteor', 'versions'),
        'package.json',
        meteorMainModule,
    ]
    // List of packages to remove for the placeholder project.
    // This comes in handy for some Meteor build plugins that can conflict with Meteor-Vite.
    const replaceMeteorPackages = [
        { startsWith: 'standard-minifier', replaceWith: '' },
        { startsWith: 'refapp:meteor-typescript', replaceWith: 'typescript' },
        ...pkg?.meteor?.vite?.replacePackages || []
    ]
    const optionalFiles = [
        'tsconfig.json'
    ]
    
    Logger.info('Building packages to make them available to export analyzer...')
    
    // Check for project files that may be important if available
    for (const file of optionalFiles) {
        if (fs.existsSync(path.join(cwd, file))) {
            filesToCopy.push(file);
        }
    }
    
    // Copy files from `.meteor`
    for (const file of filesToCopy) {
        const from = path.join(cwd, file)
        const to = path.join(tempMeteorProject, file)
        fs.ensureDirSync(path.dirname(to))
        fs.copyFileSync(from, to)
    }
    
    // Symblink to `packages` folder
    if (fs.existsSync(path.join(cwd, 'packages')) && !fs.existsSync(path.join(tempMeteorProject, 'packages'))) {
        fs.symlinkSync(path.join(cwd, 'packages'), path.join(tempMeteorProject, 'packages'))
    }
    // Remove/replace conflicting Atmosphere packages
    {
        const file = path.join(tempMeteorProject, '.meteor', 'packages')
        let content = fs.readFileSync(file, 'utf8')
        for (const pack of replaceMeteorPackages) {
            const lines = content.split('\n')
            content = lines.map(line => {
                if (!line.startsWith(pack.startsWith)) {
                    return line;
                }
                return pack.replaceWith || '';
            }).join('\n')
        }
        fs.writeFileSync(file, content)
    }
    // Remove server entry
    {
        const file = path.join(tempMeteorProject, 'package.json')
        const data = JSON.parse(fs.readFileSync(file, 'utf8'))
        data.meteor = {
            mainModule: {
                client: data.meteor.mainModule.client,
            },
        }
        fs.writeFileSync(file, JSON.stringify(data, null, 2))
    }
    // Only keep meteor package imports to enable lazy packages
    {
        const file = path.join(tempMeteorProject, meteorMainModule)
        const lines = fs.readFileSync(file, 'utf8').split('\n')
        const imports = lines.filter(line => line.startsWith('import') && line.includes('meteor/'))
        fs.writeFileSync(file, imports.join('\n'))
    }
    execaSync('meteor', [
        'build',
        tempMeteorOutDir,
        '--directory',
        // Ensure the temporary build doesn't abort for projects with mobile builds
        // Since this is only a temporary build, it shouldn't impact the final production build for the developer.
        '--server=http://localhost:3000',
    ], {
        cwd: tempMeteorProject,
        // stdio: ['inherit', 'inherit', 'inherit'],
        env: {
            FORCE_COLOR: '3',
            VITE_METEOR_DISABLED: 'true',
        },
    })
    
    profile.complete(`Packages built`);
}