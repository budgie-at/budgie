import { afterEach, beforeEach, vi } from 'vitest';

export const freezeDateClock = (now: Date) => {
    beforeEach(() => {
        vi.useFakeTimers({ now, toFake: ['Date'] });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
};
