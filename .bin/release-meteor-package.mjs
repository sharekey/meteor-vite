import { execSync, spawn } from 'child_process';
import Path from 'path';
import FS from 'fs/promises';

// Assuming this is launched from the repository root for now.
const repoPath = process.cwd();
const PACKAGE_NAME_REGEX = /name:\s*'(?<packageName>(?<author>[\w\-._]+):(?<name>[\w\-._]+))'\s*,/;
const PACKAGE_VERSION_REGEX = /version:\s*'(?<version>[\d\w.-]+)'\s*,/;
const CHANGESET_STATUS_FILE = 'changeset-status.json';
const meteorPackage = {
    releaseName: 'vite-bundler',
    packageJsPath: Path.join(repoPath, './packages/vite-bundler/package.js'),
};
const logger = {
    _history: [],
    _log(level, params) {
        console[level].apply(this, params);
        this._history.push(params.join(' '));
    },
    info: (...params) => logger._log('info', params),
    error: (...params) => logger._log('error', params),
    emitSummary() {
        if (!process.env.GITHUB_STEP_SUMMARY) {
            return;
        }

        let summary = `\n### Release Meteor Package\n\n`;
        summary += '```\n';
        summary += this._history.join('\n');
        summary += '\n```\n';

        FS.appendFile(process.env.GITHUB_STEP_SUMMARY, summary, (error) => {
            if (!error) return;
            console.error(error);
        });
    },
}

async function parsePackageJs(packageJsPath) {
    logger.info(`⚡  Parsing ${Path.basename(Path.dirname(packageJsPath))} package.js file...`);
    logger.info(`  L ${packageJsPath}`);
    const rawContent = await FS.readFile(packageJsPath, 'utf-8');
    const name = rawContent.match(PACKAGE_NAME_REGEX)?.groups.packageName;
    const version = rawContent.match(PACKAGE_VERSION_REGEX)?.groups?.version;

    return {
        rawContent,
        name,
        version,
    }
}

async function applyVersion(buildMetadata = '') {
    shell(`changeset status --output ${CHANGESET_STATUS_FILE}`);

    const { releases } = await FS.readFile(`${CHANGESET_STATUS_FILE}`, 'utf-8')
                                 .then((content) => JSON.parse(content));

    const release = releases.find(({ name }) => name === meteorPackage.releaseName);

    if (!release) {
        logger.info('⚠️  No pending releases found for %s', meteorPackage.releaseName);
        return;
    }

    logger.info(`ℹ️  New version ${release.newVersion} for ${meteorPackage.releaseName} detected`);

    const { rawContent, version, name } = await parsePackageJs(meteorPackage.packageJsPath);
    if (!version) {
        throw new Error(`Unable to read version from ${meteorPackage.releaseName} package.js`);
    }
    const patchedPackageJs = rawContent.replace(PACKAGE_VERSION_REGEX, `version: '${release.newVersion}${buildMetadata}',`);
    await FS.writeFile(meteorPackage.packageJsPath, patchedPackageJs);

    logger.info(`✅  Changed ${meteorPackage.releaseName} (${name}) version from v${version} to v${release.newVersion}\n`);

    shell(`git add ${meteorPackage.packageJsPath}`);
    shell(`git commit -m 'Bump ${meteorPackage.releaseName} version to ${release.newVersion}'`);
}

async function publish() {
    logger.info(`⚡  Publishing ${meteorPackage.releaseName}...`);

    let command = `meteor publish`;

    if (process.env.METEOR_RELEASE) {
        command += ` --release ${process.env.METEOR_RELEASE}`
    }

    shell(command, {
        async: true,
        cwd: Path.dirname(meteorPackage.packageJsPath),
        env: {
            METEOR_SESSION_FILE: process.env.METEOR_SESSION_FILE, // Authenticate using auth token stored as file.
            VITE_METEOR_DISABLED: 'true', // Prevents vite:bundler from trying to compile itself on publish
            ...process.env,
        },
    });
}

function shell(command, options) {
    logger.info(`$ ${command}`);
    if (!options?.async) {
        logger.info(execSync(command, { ...options, encoding: 'utf-8' }));
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
    const meteorVersion = process.env.METEOR_RELEASE;

    if (action === 'publish') {
        await publish();
        return;
    }

    if (action === 'version') {
        await applyVersion(meteorVersion && `+meteor-v${meteorVersion}`);
        return;
    }

    throw new Error(`The provided argument is not recognized: "${action}"`);

})().catch((error) => {
    const { stdout, stderr } = error;

    if (stdout) {
        logger.info(stdout.toString());
    }
    if (stderr) {
        logger.error(stderr.toString());
    }

    logger.emitSummary();
    process.exit(1);
}).finally(() => {
    logger.emitSummary();
});
