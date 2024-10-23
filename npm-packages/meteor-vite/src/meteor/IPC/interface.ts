export default function CreateIPCInterface<
    Methods extends {
        [key in string]: (reply: IPCReply<{ readonly kind: string, data: unknown }>, ...params: [params: any]) => void;
    },
>(methods: Methods) {
    return methods;
}

export type IPCInterface<Methods, Replies> = { [key in keyof Methods]: (reply: (data: Replies) => void) => void }

export type IPCReply<Reply extends {
    readonly kind: string;
    data: unknown;
}> = (reply: Reply) => void;

export function defineIpcMethods<TMethods extends {
    [key in string]: (...params: any) => Promise<void> | void;
}>(methods: TMethods): TMethods {
    return methods;
}