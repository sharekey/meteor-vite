import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ViteProductionBoilerplate } from './boilerplate/Production';
import Logger from '../../utilities/Logger';
import { setBoilerplate } from './lib/RuntimeConfig';
import type { ViteManifestFile } from './scripts/Build';

Meteor.startup(async () => {
    if (!Meteor.isProduction) {
        return;
    }
    console.log('[Vite] Fetching manifest...');
    const manifest = await Assets.getTextAsync(`${__VITE_ASSETS_DIR__}/client.manifest.json`);
    const files: Record<string, ViteManifestFile> = JSON.parse(manifest);
    
    // Todo: retrieve base and assets dir from build config/manifest file
    const boilerplate = new ViteProductionBoilerplate({
        base: process.env.METEOR_VITE_BASE_URL || import.meta.env.BASE_URL,
        assetsDir: __VITE_ASSETS_DIR__,
        files,
    });
    
    WebApp.handlers.use(boilerplate.baseUrl, (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'text/plain');
        res.writeHead(404, 'Not found');
        res.write('Vite asset not found');
        res.end();
        Logger.warn(`Served 404 for unknown Vite asset: ${req.originalUrl}`);
    })
    
    // Todo: Instead of serving assets with Meteor's built-in static file handler,
    //  add a custom asset route where we have better control over caching and CORS rules.
    boilerplate.makeViteAssetsCacheable();
    
    const { dynamicBody, dynamicHead } = boilerplate.getBoilerplate();
    await setBoilerplate({
        head: dynamicHead ? [dynamicHead] : [],
        body: dynamicBody ? [dynamicBody] : [],
    });
    await import('./CommonEnvironment');
})

