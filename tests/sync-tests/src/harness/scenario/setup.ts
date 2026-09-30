import { assertStoredBalancesMatchLedger, buildTestDb, resetTestDb } from '@budgie-at/test-kit';
import * as Effect from 'effect/Effect';
import { vi, afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { emptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

vi.mock('@app/sync/service/transfer-consolidation-drainer.service', async () => {
    const { FakeTransferConsolidationDrainerService } = await import('../fake/fake-transfer-consolidation-drainer.service');

    return { TransferConsolidationDrainerService: FakeTransferConsolidationDrainerService };
});

vi.mock('@app/@generic/constant/yield-to-ui.constant', () => ({ YIELD_TO_UI: Effect.void }));

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
        locale: 'en',
        load: emptyFn,
        activate: emptyFn,
        _: (descriptor: unknown, values?: Record<string, string>): string => {
            const message = resolveLinguiMessage(descriptor);

            if (!isDefined(values)) {
                return message;
            }

            return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), message);
        }
    }
}));

export const backupDatabasePath = isNotEmptyString(process.env['BUDGIE_BACKUP_DB']) ? process.env['BUDGIE_BACKUP_DB'] : null;

export const testDb = buildTestDb(backupDatabasePath);

vi.mock('@app/@generic/drizzle/db/db', () => ({
    db: testDb,
    expoDb: { closeAsync: vi.fn((): Promise<void> => Promise.resolve()) }
}));

vi.mock('@app/@generic/runtime/app.runtime', async () => {
    const { testRuntime } = await import('./test-runtime');

    return { appRuntime: testRuntime };
});

import { mockServer } from './mock-server';

beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
    if (!isDefined(backupDatabasePath)) {
        resetTestDb(testDb);
    }
});

afterEach(async () => {
    mockServer.resetHandlers();
    await assertStoredBalancesMatchLedger(testDb);
});

afterAll(() => {
    mockServer.close();
});
