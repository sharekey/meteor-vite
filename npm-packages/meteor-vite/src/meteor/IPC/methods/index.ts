import { IPCReply } from '../interface';
import PackageBuild from './watch-npm-package';
import ProductionBuilder from './build';
import ViteServerWorker from './vite-server';

const IpcMethods = {
    ...ViteServerWorker,
    ...ProductionBuilder,
    ...PackageBuild,
} as const;

export default IpcMethods;

export type WorkerMethod = { [key in keyof IPCMethods]: [name: key, method: IPCMethods[key]]
                           } extends {
                               [key: string]: [infer Name, infer Method]
                           } ? Name extends keyof IPCMethods
                               ? { method: Name, params: Parameters<IPCMethods[Name]> extends [infer Reply, ...infer Params]
                                                         ? Params
                                                         : [] }
                               : never
                             : never;

export type WorkerResponse = WorkerReplies[keyof IPCMethods][1];
type WorkerReplies = {
    [key in keyof IPCMethods]: IPCMethods[key] extends (reply: IPCReply<infer Reply>, ...params: any) => any
                               ? Reply extends { readonly kind: string, data: {} }
                                 ? [Reply['kind'], Reply]
                                 : never
                               : never;
};

export type IPCMethods = typeof IpcMethods;
export type WorkerResponseData<Kind extends WorkerResponse['kind']> = Extract<WorkerResponse, { kind: Kind }>['data']
export type WorkerResponseHooks = {
    [key in WorkerResponse['kind']]: (data: WorkerResponseData<key>) => void;
}
