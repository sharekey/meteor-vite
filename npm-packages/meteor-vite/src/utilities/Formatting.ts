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
export function formatImportPath(path: string) {
    return Path.posix.join(...path.split(Path.sep));
}

/**
 * Create a module import string for the provided path.
 * Normalizes import paths to handle platform-specific path formatting.
 * @param path Module/import path
 */
export function moduleImport(path: string) {
    return `import ${JSON.stringify(formatImportPath(path))}`;
}