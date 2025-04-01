import Path from 'path';
import pc from 'picocolors';

export const Colorize = {
    filepath: pc.cyan,
    arch: pc.yellow,
    versionNumber: pc.blue,
    textSnippet: pc.white,
};

/**
 * Format import paths to a Node-compatible format.
 * Fixes issues where paths built in Windows environments are using backslashes instead of the expected forward slash
 * format.
 * @param path File/import path
 */
function formatImportPath(path: string) {
    return path.replaceAll(Path.sep, Path.posix.sep);
}

/**
 * Create a module import string for the provided path.
 * Normalizes import paths to handle platform-specific path formatting.
 * @param path Module/import path
 */
export function moduleImport(path: string) {
    return `import ${JSON.stringify(formatImportPath(path))}`;
}

/**
 * Normalize and compare two file paths.
 */
export function isSamePath(pathA: string, pathB: string) {
    return Path.normalize(trimTrailingSlash(pathA)) === Path.normalize(trimTrailingSlash(pathB));
}

export function trimTrailingSlash(path: string) {
    return path.replace(/\/+$/, '');
}

/**
 * Check whether the provided module content has an import for the provided path.
 * @param module
 */
export function hasModuleImport(module: { content: string, path: string }) {
    const expectedContent = formatImportPath(module.path);
    return module.content.includes(expectedContent);
}

export function viteAssetUrl({ arch, path, base }: {
    arch: Arch;
    path: string;
    base?: string;
}): string {
    try {
        if (path.match(/^https?:/)) {
            return path;
        }
        
        if (base?.match(/^https?:/)) {
            return new URL(path, base).href;
        }
        
        if (arch.includes('cordova')) {
            const base = process.env.CDN_URL || process.env.MOBILE_ROOT_URL || process.env.ROOT_URL;
            return new URL(path, base).href;
        }
        
        const relativePath = path.replaceAll(Path.win32.sep, Path.posix.sep);
        
        if (!base) {
            const absoluteBase = process.env.CDN_URL || process.env.ROOT_URL
            if (absoluteBase) {
                return new URL(path, base).href;
            }
            return relativePath;
        }
        
        return Path.posix.join(base, relativePath);
    } catch (error) {
        throw new Error(`⚡  Failed to prepare URL for Vite asset! Try setting a ROOT_URL for your app. If you're using Cordova, make sure you set an external Mobile server URL (e.g. --mobile-server http://192.168.0.1:3000/)`, {
            cause: error,
        });
    }
}

export type Arch = 'web.browser' | 'os.linux' | 'web.cordova' | string;