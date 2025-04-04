import { readFileSync } from 'node:fs';

export const { version, homepage, bugs } = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as {
    version: string;
    homepage: string;
    bugs: {
        url: string;
    };
}

