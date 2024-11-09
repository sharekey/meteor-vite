import { runBootstrapScript } from './util/Bootstrap';


try {
    await runBootstrapScript('initializeViteDevServer');
    console.log('Vite should be ready to go!');
}  catch (error) {
    console.warn('Failed to start Vite dev server!');
    console.error(error);
}


export {}
