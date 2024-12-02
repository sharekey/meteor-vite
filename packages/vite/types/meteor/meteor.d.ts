declare module 'meteor/meteor' {
    namespace Meteor {
        const isFibersDisabled: boolean | undefined;
        
        const server: {
            method_handlers: Record<string, Function>;
            publish_handlers: Record<string, Function>;
        }
    }
}
