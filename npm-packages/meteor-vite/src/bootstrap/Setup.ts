import FS from 'node:fs';
import { createSimpleLogger } from '../utilities/Logger';
import pc from 'picocolors';
import { CurrentConfig } from './Config';

const logger = createSimpleLogger('Setup');

export function setupProject() {
    cleanupPreviousBuilds();
    // Create entry modules for the server.
}

/**
 * Clean up temporary files created by previous production builds.
 * Remaining build files can interfere with the dev server
 */
function cleanupPreviousBuilds() {
    FS.rmSync(CurrentConfig.outDir, { recursive: true, force: true });
    logger.debug(`Cleaned up old build output in ${pc.green(CurrentConfig.outDir)}`);
}