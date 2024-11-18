/**
 * This is not a real module that can be imported,
 * we are just defining this as a module so we can more easily get
 * type checking for Meteor's isobuild tool globals. Imports are
 * stubbed out when building the package.
 */
declare module 'meteor/isobuild' {
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
    
    namespace Plugin {
        type CompilerPluginConfig = {
            extensions: string[];
            filenames: string[];
        }
        type FactoryFunction = () => { processFilesForTarget(): void };
        function registerCompiler(config: CompilerPluginConfig, compilerFactory: FactoryFunction): void;
    }
}
