import { reactive } from 'vue';

export const GlobalState = reactive({
    currentTime: Date.now(),
});

setInterval(() => {
    GlobalState.currentTime = Date.now();
}, 1250);