import { vi } from 'vitest';

export const useFakeDrainTimers = (): void => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.stubGlobal('requestIdleCallback', null);
    vi.stubGlobal('cancelIdleCallback', null);
};
