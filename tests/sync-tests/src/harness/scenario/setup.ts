import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { assertStoredBalancesMatchLedger, resetTestDb } from '@budgie-at/test-kit';
import { InstrumentDailyMarketPriceEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import { vi, afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { emptyFn, isDefined } from '@rnw-community/shared';

vi.mock('@app/@generic/drizzle/service/database-connection.service', async () => {
    const { FakeDatabaseConnectionService } = await import('../fake/fake-database-connection.service');

    return { DatabaseConnectionService: FakeDatabaseConnectionService };
});

vi.mock('@budgie/contracts', async importOriginal => {
    const { void: voidEffect } = await import('effect/Effect');

    return { ...(await importOriginal<typeof import('@budgie/contracts')>()), YIELD_TO_UI: voidEffect };
});

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

vi.mock('react-native', async importOriginal => ({
    ...(await importOriginal<object>()),
    AppState: (await import('../native/native-module.stub')).appStateStub
}));

vi.mock('expo-constants', async () => ({ default: (await import('../native/native-module.stub')).expoConstantsStub }));

vi.mock('expo-file-system', async importOriginal => ({
    ...(await importOriginal<object>()),
    ...(await import('../native/native-module.stub')).expoFileSystemStub
}));

vi.mock('expo-notifications', async importOriginal => ({
    ...(await importOriginal<object>()),
    ...(await import('../native/native-module.stub')).expoNotificationsStub
}));

vi.mock('expo-secure-store', async importOriginal => ({
    ...(await importOriginal<object>()),
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 0,
    ...(await import('../native/native-module.stub')).expoSecureStoreStub
}));

vi.mock('llama.rn', async () => (await import('../native/native-module.stub')).llamaStub);

vi.mock('whisper.rn', async () => (await import('../native/native-module.stub')).whisperStub);

vi.mock('@app/@generic/runtime/app.runtime', async () => {
    const { testAtomRuntime, testRuntime } = await import('./test-runtime');

    return { appAtomRuntime: testAtomRuntime, appRuntime: testRuntime };
});

vi.mock('expo-app-intents', async () => {
    const { walletCaptureNativeStub } = await import('../wallet-capture/wallet-capture-app-intents.stub');

    return walletCaptureNativeStub;
});

import { enableBankingStub } from '../enable-banking/enable-banking-stub';
import { testSigner } from '../enable-banking/test-sync-request-signer';
import { expoConstantsStub } from '../native/native-module.stub';
import { walletCaptureNativeStub } from '../wallet-capture/wallet-capture-app-intents.stub';

import { mockServer } from './mock-server';
import { backupDatabasePath, testDb } from './test-db';

beforeAll(() => {
    appAtomRegistry.reset();
    mockServer.listen({ onUnhandledFrame: 'error' });
});

beforeEach(() => {
    walletCaptureNativeStub.reset();
    testSigner.reset();
    enableBankingStub.reset();
    expoConstantsStub.expoConfig.extra.aiEnabled = true;
    if (!isDefined(backupDatabasePath)) {
        return Effect.runPromise(
            resetTestDb(testDb).pipe(
                Effect.andThen(
                    testDb.delete(InstrumentDailyMarketPriceEntityTable).where(eq(InstrumentDailyMarketPriceEntityTable.source, 'INZHUR'))
                )
            )
        );
    }

    return undefined;
});

afterEach(() => {
    mockServer.resetHandlers();

    return Effect.runPromise(assertStoredBalancesMatchLedger(testDb));
});

afterAll(() => {
    mockServer.close();
});
