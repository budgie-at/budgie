import { vi } from 'vitest';

const immediateTimerMs = 0;

export const flushScheduledDrain = async (drainDelayMs: number): Promise<void> => {
    await vi.advanceTimersByTimeAsync(drainDelayMs);
    await vi.advanceTimersByTimeAsync(immediateTimerMs);
    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();
};
