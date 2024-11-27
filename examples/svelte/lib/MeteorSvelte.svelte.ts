import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { onDestroy } from 'svelte';


export function useTracker<TType>(handle: () => TType): TType {
    let state: TType = $state(handle());
    
    const computation = Tracker.autorun(() => {
        state = handle();
    });
    
    onDestroy(() => computation.stop());
    
    return state;
}

export function useSubscribe(publication: string, ...params: unknown[]) {
    return useTracker(() => {
        const handle = Meteor.subscribe(publication, ...params);
        const ready = handle.ready();
        console.debug({ publication, handle, ready });
        return ready;
    });
}