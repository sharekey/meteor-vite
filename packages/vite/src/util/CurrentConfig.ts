import FS from 'fs';
import Path from 'path';

function guessCwd () {
    let cwd = process.env.PWD ?? process.cwd()
    const index = cwd.indexOf('.meteor')
    if (index !== -1) {
        cwd = cwd.substring(0, index)
    }
    return cwd
}

const projectRoot = guessCwd();
const packageJson = FS.readFileSync(Path.join(projectRoot, 'package.json'), 'utf8');

export const CurrentConfig = {
    projectRoot,
    bootstrapEvalFilename: Path.join(projectRoot, '__meteor-vite-runtime-bootstrap__.ts'),
    packageJson: JSON.parse(packageJson),
};

console.debug({
    CurrentConfig,
})