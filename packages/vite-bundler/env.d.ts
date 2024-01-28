declare global {
    interface PromiseConstructor {
        await<T>(promise: Promise<T>): T;
    }
}

export {}