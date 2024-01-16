import Logger from '../utility/Logger';
import Path from 'node:path';

export default class Compiler {
    protected static cleanupHandlers: CleanupHandler[] = [];
    
    public static addCleanupHandler(handler: CleanupHandler) {
        this.cleanupHandlers.push(handler);
    }
    
    protected processFilesForTarget(files: BuildPluginFile[]) {
        files.forEach(file => {
            Logger.debug(`Processing: ${file.getBasename()}`)
            switch (Path.extname(file.getBasename())) {
                case '.js':
                    file.addJavaScript({
                        path: file.getPathInPackage(),
                        data: file.getContentsAsString(),
                    })
                    break
                case '.css':
                    file.addStylesheet({
                        path: file.getPathInPackage(),
                        data: file.getContentsAsString(),
                    })
                    break
                default:
                    file.addAsset({
                        path: file.getPathInPackage(),
                        data: file.getContentsAsBuffer(),
                    })
            }
        })
    }
    
    protected afterLink () {
        Compiler.cleanupHandlers.forEach((handle) => handle());
        Compiler.cleanupHandlers = [];
    }
    
}
type CleanupHandler = () => void;
type PluginFileBuffer = ArrayBufferLike;
interface BuildPluginFile {
    getContentsAsString(): string;
    getPathInPackage(): string;
    getContentsAsBuffer(): PluginFileBuffer;
    getBasename(): string;
    addAsset(data: FileData): void;
    addStylesheet(data: FileData): void;
    addJavaScript(data: FileData): void;
}
interface FileData {
    path: string;
    data: string | PluginFileBuffer;
}