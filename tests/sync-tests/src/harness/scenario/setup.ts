import { buildTestDb, createTestRepositories, resetTestDb } from '@budgie-at/test-kit';
import * as Effect from 'effect/Effect';
import { vi, afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { isDefined } from '@rnw-community/shared';

vi.mock('@app/sync/service/transfer-consolidation-drainer.service', () => ({
    transferConsolidationDrainerService: { cancelPending: vi.fn(() => Effect.void), enqueue: vi.fn(() => Effect.void) }
}));

vi.mock('@app/@generic/utils/micro-pause.util', () => ({
    microPause: vi.fn((): Promise<void> => Promise.resolve())
}));

const resolveLinguiMessage = (descriptor: unknown): string => {
    if (typeof descriptor === 'string') {
        return descriptor;
    }

    if (typeof descriptor === 'object' && descriptor !== null && 'message' in descriptor && typeof descriptor.message === 'string') {
        return descriptor.message;
    }

    return '';
};

vi.mock('@lingui/core', () => ({
    i18n: {
        _: (descriptor: unknown, values?: Record<string, string>): string => {
            const message = resolveLinguiMessage(descriptor);

            if (!isDefined(values)) {
                return message;
            }

            return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), message);
        }
    }
}));

export const testDb = buildTestDb();

vi.mock('@app/@generic/drizzle/db/db', async () => ({
    db: testDb,
    ...createTestRepositories(testDb),
    expoDb: { closeAsync: vi.fn((): Promise<void> => Promise.resolve()) },
    __REMOVE_ME_RESET_DB: (): Promise<void> => Promise.resolve()
}));

vi.mock('@app/@generic/runtime/app.runtime', async () => {
    const { testRuntime } = await import('./test-runtime');

    return { appRuntime: testRuntime };
});

import { mockServer } from './mock-server';

beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: 'error' });
});

beforeEach(async () => {
    resetTestDb(testDb);
    const { resetTestRuntime } = await import('./test-runtime');
    await resetTestRuntime();
    const { resetSingletons } = await import('./reset-singletons');
    resetSingletons();
});

afterEach(() => {
    mockServer.resetHandlers();
});

afterAll(() => {
    mockServer.close();
});
