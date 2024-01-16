export function msToHumanTime(milliseconds: number) {
    return `${Math.round(milliseconds * 100) / 100}ms`;
}