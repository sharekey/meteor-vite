
async function init() {
    const { createServer, resolveConfig  } = await import('vite');
    const { meteor } = await import('meteor-vite/plugin');
    const config = await resolveConfig({}, 'serve')
    
    const server = await createServer({
        configFile: config.configFile,
    });
    await server.listen();
    
    return {
        server,
    }
}

init();