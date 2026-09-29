import { setTimeout } from 'node:timers';

import { vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { sleepMode } from '../scenario/sleep-mode';

export const withCoolDownSpy = async (coolDownWindowMs: number, run: () => Promise<void>): Promise<number[]> => {
    const coolDownDelays: number[] = [];
    const realSetTimeout = setTimeout;
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((handler, delay, ...args) => {
        if (typeof handler === 'function' && delay === coolDownWindowMs) {
            coolDownDelays.push(delay);
            handler();
            const noopTimerId = realSetTimeout(emptyFn, 0);
            globalThis.clearTimeout(noopTimerId);

            return noopTimerId;
        }

        return realSetTimeout(handler, delay, ...args);
    });

    sleepMode.isRateLimitInstant = false;

    try {
        await run();
    } finally {
        sleepMode.isRateLimitInstant = true;
        setTimeoutSpy.mockRestore();
    }

    return coolDownDelays;
};
