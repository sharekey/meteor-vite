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