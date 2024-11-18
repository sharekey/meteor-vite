namespace Plugin {
    type CompilerPluginConfig = {
        extensions: string[];
        filenames: string[];
    }
    type FactoryFunction = () => { processFilesForTarget(): void };
    function registerCompiler(config: CompilerPluginConfig, compilerFactory: FactoryFunction): void;
    interface InputFile {
        getContentsAsString(): string;
        getPathInPackage(): string;
        getContentsAsBuffer(): PluginFileBuffer;
        getBasename(): string;
        addAsset(data: FileData): void;
        addStylesheet(data: FileData): void;
        addJavaScript(data: FileData): void;
        getArch(): string;
        cacheable?: boolean;
    }
    interface FileData {
        path: string;
        data: string | PluginFileBuffer;
        sourcePath?: string;
        sourceMap?: null | string;
    }
}

declare global {
    var Plugin: typeof Plugin;
}