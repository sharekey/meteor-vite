import pc from 'picocolors';
import { readFileSync } from 'node:fs';

export const { version, homepage } = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)

export const Colorize = {
    filepath: pc.cyan,
    arch: pc.yellow,
    versionNumber: pc.blue,
    textSnippet: pc.white,
}