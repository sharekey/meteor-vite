import { execSync, spawn } from 'child_process';
import Path from 'path';
import FS from 'fs/promises';

// Assuming this is launched from the repository root for now.
const repoPath = process.cwd();
const PACKAGE_NAME_REGEX = /name:\s*'(?<packageName>(?<author>[\w\-._]+):(?<name>[\w\-._]+))'\s*,/;
const PACKAGE_VERSION_REGEX = /version:\s*'(?<version>[\d.]+)'\s*,/;
const CHANGESET_STATUS_FILE = 'changeset-status.json';
const meteorPackage = {
    releaseName: 'vite-bundler',
    packageJsPath: Path.join(repoPath, './packages/vite-bundler/package.js'),
}

async function applyVersion() {
    shell(`changeset status --output ${CHANGESET_STATUS_FILE}`);

    const { releases } = await FS.readFile(`${CHANGESET_STATUS_FILE}`, 'utf-8')
                                 .then((content) => JSON.parse(content));

    const release = releases.find(({ name }) => name === meteorPackage.releaseName);

    if (!release) {
        console.log('⚠️  No pending releases found for %s', meteorPackage.releaseName);
        return;
    }

    console.log(`ℹ️  New version ${release.newVersion} for ${meteorPackage.releaseName} detected`);

    let packageJsContent = await FS.readFile(meteorPackage.packageJsPath, 'utf-8');
    const packageName = packageJsContent.match(PACKAGE_NAME_REGEX)?.groups.packageName;
    const currentVersion = packageJsContent.match(PACKAGE_VERSION_REGEX)?.groups?.version
    if (!currentVersion) {
        throw new Error(`Unable to read version from ${meteorPackage.releaseName} package.js`)
    }
    packageJsContent = packageJsContent.replace(PACKAGE_VERSION_REGEX, `version: '${release.newVersion}',`);
    await FS.writeFile(meteorPackage.packageJsPath, packageJsContent);

    console.log(`✅  Changed ${meteorPackage.releaseName} (${packageName}) version from v${currentVersion} to v${release.newVersion}\n`);

    shell(`git add ${meteorPackage.packageJsPath}`);
    shell(`git commit -m 'Bump ${meteorPackage.releaseName} version to ${release.newVersion}'`);
}

async function publish() {
    console.log(`⚡  Publishing ${meteorPackage.releaseName}...`);

    shell('meteor publish', {
        async: true,
        cwd: Path.dirname(meteorPackage.packageJsPath),
        env: {
            METEOR_SESSION_FILE: process.env.METEOR_SESSION_FILE, // Authenticate using auth token stored as file.
            VITE_METEOR_DISABLED: 'true', // Prevents vite:bundler from trying to compile itself on publish
            ...process.env,
        }
    })
}

function shell(command, options) {
    console.log(`$ ${command}`);
    if (!options?.async) {
        console.log(execSync(command, { ...options, encoding: 'utf-8' }));
        return;
    }
    const [bin, ...args] = command.split(' ');
    spawn(bin, args, {
        ...options,
        stdio: 'inherit',
    });
}

(async () => {
    const [binPath, modulePath, action] = process.argv;

    if (action === 'publish') {
        await publish();
        return;
    }

    if (action === 'version') {
        await applyVersion();
        return;
    }

    throw new Error(`The provided argument is not recognized: "${action}"`)

})().catch((error) => {
    const { stdout, stderr } = error;

    if (stdout) {
        console.log(stdout.toString())
    }
    if (stderr) {
        console.error(stderr.toString());
    }

    process.exit(1);
});
