import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { assertStoredBalancesMatchLedger, resetTestDb } from '@budgie-at/test-kit';
import * as Effect from 'effect/Effect';
import { getResponse, RequestHandler } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, expect, vi } from 'vitest';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

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

vi.mock('@lingui/core', () => {
    const i18n = {
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
    };

    return { i18n, setupI18n: () => i18n };
});

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
import { sleepMode } from './sleep-mode';
import { backupDatabasePath, testDb } from './test-db';
import { liveStatements } from './test-runtime';

const ABORTED = Symbol('aborted');
const originalFetch = globalThis.fetch;
const unhandledRequests: string[] = [];

const toRequest = (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Request => {
    if (input instanceof Request) {
        return isDefined(init) ? new Request(input, init) : input;
    }

    return new Request(input, init);
};

const getAbortError = (signal: AbortSignal): Error =>
    signal.reason instanceof Error ? signal.reason : new DOMException('The operation was aborted.', 'AbortError');

const waitForAbort = (signal: AbortSignal): Effect.Effect<typeof ABORTED> =>
    Effect.callback<typeof ABORTED>(resume => {
        if (signal.aborted) {
            resume(Effect.succeed(ABORTED));

            return;
        }

        const onAbort = () => {
            resume(Effect.succeed(ABORTED));
        };

        signal.addEventListener('abort', onAbort, { once: true });

        return Effect.sync(() => void signal.removeEventListener('abort', onAbort));
    });

const resolveMockRequest = (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> => {
    const request = toRequest(input, init);

    if (request.signal.aborted) {
        return Promise.reject(getAbortError(request.signal));
    }

    const handlers = mockServer.listHandlers().filter((handler): handler is RequestHandler => handler instanceof RequestHandler);

    return Effect.runPromise(
        Effect.race(
            Effect.promise(() =>
                getResponse(handlers, request).then(
                    response => ({ ok: true as const, response }),
                    (cause: unknown) => ({ ok: false as const, cause })
                )
            ),
            waitForAbort(request.signal)
        )
    ).then(result => {
        if (result === ABORTED) {
            throw getAbortError(request.signal);
        }

        if (!result.ok) {
            throw result.cause instanceof Error ? result.cause : new TypeError(getErrorMessage(result.cause));
        }

        const { response } = result;

        if (!isDefined(response)) {
            unhandledRequests.push(`${request.method} ${request.url}`);

            throw new TypeError(`Unhandled mocked request: ${request.method} ${request.url}`);
        }

        if (response.type === 'error') {
            throw new TypeError('Failed to fetch');
        }

        return response;
    });
};

beforeAll(() => {
    appAtomRegistry.reset();
    globalThis.fetch = resolveMockRequest;
});

beforeEach(() => {
    appAtomRegistry.reset();
    sleepMode.isRateLimitInstant = true;
    liveStatements.length = 0;
    unhandledRequests.length = 0;
    walletCaptureNativeStub.reset();
    testSigner.reset();
    enableBankingStub.reset();
    expoConstantsStub.expoConfig.extra.aiEnabled = true;
    if (!isDefined(backupDatabasePath)) {
        return Effect.runPromise(resetTestDb(testDb));
    }

    return undefined;
});

afterEach(() => {
    vi.useRealTimers();
    mockServer.resetHandlers();

    return Effect.runPromise(
        assertStoredBalancesMatchLedger(testDb).pipe(
            Effect.andThen(
                Effect.sync(() => {
                    expect(unhandledRequests).toEqual([]);
                })
            )
        )
    );
});

afterAll(() => {
    globalThis.fetch = originalFetch;
});
