export type Boilerplate = {
    dynamicHead?: string;
    dynamicBody?: string;
}
export abstract class ViteBoilerplate {
    public abstract getBoilerplate(): Promise<Boilerplate> | Boilerplate;
}