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

export const CurrentConfig = {
    projectRoot,
    bootstrapEvalFilename: Path.join(projectRoot, 'server', '__meteor-vite-runtime-bootstrap__.ts')
};