import { vi } from 'vitest';

export const withCoolDownSpy = async (coolDownWindowMs: number, run: () => Promise<void>): Promise<number[]> => {
    const coolDownDelays: number[] = [];
    const realSetTimeout = globalThis.setTimeout;
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((handler: TimerHandler, delay?: number, ...args) => {
        if (typeof handler === 'function' && delay === coolDownWindowMs) {
            coolDownDelays.push(delay);
            handler();

            return 0 as unknown as ReturnType<typeof setTimeout>;
        }

        return realSetTimeout(handler, delay, ...args);
    });

    try {
        await run();
    } finally {
        setTimeoutSpy.mockRestore();
    }

    return coolDownDelays;
};
