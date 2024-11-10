namespace Plugin {
    type CompilerPluginConfig = {
        extensions: string[];
        filenames: string[];
    }
    type FactoryFunction = () => { processFilesForTarget(): void };
    function registerCompiler(config: CompilerPluginConfig, compilerFactory: FactoryFunction): void;
}

declare global {
    var Plugin: typeof Plugin;
}