export function guessCwd () {
    let cwd = process.env.PWD ?? process.cwd()
    const index = cwd.indexOf('.meteor')
    if (index !== -1) {
        cwd = cwd.substring(0, index)
    }
    return cwd
}