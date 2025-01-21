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
    return path.replace(Path.sep, Path.posix.sep);
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
 * Check whether the provided module content has an import for the provided path.
 * @param module
 */
export function hasModuleImport(module: { content: string, path: string }) {
    const expectedContent = formatImportPath(module.path);
    return module.content.includes(expectedContent);
}