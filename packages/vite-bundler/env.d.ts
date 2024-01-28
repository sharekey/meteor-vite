declare global {
    interface PromiseConstructor {
        await<T>(promise: Promise<T>): T;
    }
}

declare module 'meteor/meteor' {
    namespace Meteor {
        const isFibersDisabled: boolean | undefined;
    }
}

export {}