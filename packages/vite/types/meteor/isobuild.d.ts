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
        
        /**
         * @link https://github.com/meteor/meteor/blob/ae8cf586acc9a4c7bf9a5ab79dc5f8b7ef433a64/tools/isobuild/compiler-plugin.js#L545
         * @param html
         * @param lazyInitializer Optional function that can be called to obtain any remaining options that may be
         * expensive to compute, and thus should only be computed if/when we are sure this HTML will be used by the
         * application.
         */
        addHtml(html: HtmlData, lazyInitializer?: () => Promise<HtmlData>);
        getArch(): string;
        cacheable?: boolean;
    }
    
    interface FileData {
        path: string;
        data: string | PluginFileBuffer;
        sourcePath?: string;
        sourceMap?: null | string;
    }
    
    interface HtmlData {
        /**
         * Which section of the HTML document should be appended to.
         */
        section: 'head' | 'body';
        /**
         * The content to append.
         */
        data: string;
    }
    
    namespace Plugin {
        type CompilerPluginConfig = {
            extensions: string[];
            filenames: string[];
        }
        interface CompilerPlugin {
            processFilesForTarget(files: InputFile[]): void | Promise<void>;
        }
        type FactoryFunction = () => CompilerPlugin | Promise<CompilerPlugin>;
        function registerCompiler(config: CompilerPluginConfig, compilerFactory: FactoryFunction): void;
    }
}
