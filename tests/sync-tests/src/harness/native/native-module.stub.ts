import { vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

export const appStateStub = {
    currentState: 'active',
    addEventListener: vi.fn((_event: string, _listener: (state: 'active' | 'background') => void) => ({ remove: emptyFn }))
};

export const expoConstantsStub = { expoConfig: { extra: { aiEnabled: true } } };

export const expoFileSystemStub = { File: vi.fn<new (...path: string[]) => object>() };

export const expoNotificationsStub = { scheduleNotificationAsync: vi.fn((_request: unknown) => Promise.resolve('')) };

export const expoSecureStoreStub = {
    getItemAsync: vi.fn((_key: string, _options?: unknown) => Promise.resolve<string | null>(null)),
    setItemAsync: vi.fn((_key: string, _value: string, _options?: unknown) => Promise.resolve()),
    deleteItemAsync: vi.fn((_key: string, _options?: unknown) => Promise.resolve())
};

export const llamaStub = { initLlama: vi.fn((_params: unknown) => Promise.resolve<unknown>({})) };

export const whisperStub = {
    initWhisper: vi.fn((_options: unknown) => Promise.resolve<unknown>({})),
    releaseAllWhisper: vi.fn(() => Promise.resolve())
};
