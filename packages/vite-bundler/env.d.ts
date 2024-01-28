declare global {
    interface PromiseConstructor {
        await<T>(promise: Promise<T>): T;
    }
    
    namespace Plugin {
        function registerCompiler(config: {
            extensions: string[];
            filenames: string[];
        }, compilerFactory: () => object): void;
    }
}

declare module 'meteor/meteor' {
    namespace Meteor {
        const isFibersDisabled: boolean | undefined;
    }
}

export {}