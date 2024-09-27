import { differenceInMinutes, differenceInSeconds, formatDistance, formatDuration } from 'date-fns';
import { GlobalState } from '../GlobalState';

export function formatRelativeTime(date: Date, { suffix = true }): string {
    const minutes = differenceInMinutes(date, GlobalState.currentTime);
    
    if (minutes < 1) {
        return 'just now';
    }
    
    const distance = formatDuration({
        minutes,
    });
    
    if (!suffix) {
        return distance;
    }
    
    return `${distance} ago`;
}