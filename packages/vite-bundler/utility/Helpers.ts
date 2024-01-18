export function msToHumanTime(milliseconds: number) {
    const duration = {
        count: milliseconds,
        type: 'ms',
    }
    
    if (milliseconds > 1000) {
        duration.count = milliseconds / 1000;
        duration.type = 's';
    }
    
    if (duration.type === 's' && duration.count > 60) {
        duration.type = 'min'
        duration.count = duration.count / 60;
    }
    
    return `${Math.round(duration.count * 100) / 100}${duration.type}`;
}