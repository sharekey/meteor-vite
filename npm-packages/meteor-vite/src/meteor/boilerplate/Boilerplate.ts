import { WebAppInternals } from 'meteor/webapp';

export abstract class ViteBoilerplate {
    public abstract getBoilerplate(): Promise<WebAppInternals.Boilerplate> | WebAppInternals.Boilerplate;
}