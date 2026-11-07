import { toKyivDay } from './to-kyiv-day.util';

export const findLowestDayEndBalance = (movements: readonly { readonly at: Date; readonly delta: number }[]): number => {
    const netByDay = new Map<string, number>();

    for (const { at, delta } of movements) {
        const day = toKyivDay(at);

        netByDay.set(day, (netByDay.get(day) ?? 0) + delta);
    }

    let running = 0;
    let lowest = 0;

    for (const [, net] of [...netByDay].sort(([left], [right]) => left.localeCompare(right))) {
        running += net;
        lowest = Math.min(lowest, running);
    }

    return lowest;
};
