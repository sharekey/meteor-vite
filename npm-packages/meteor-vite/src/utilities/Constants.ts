import { readFileSync } from 'node:fs';

export const { version, homepage } = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
)