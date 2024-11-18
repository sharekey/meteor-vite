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
    type PluginFileBuffer = ArrayBufferLike;
}
