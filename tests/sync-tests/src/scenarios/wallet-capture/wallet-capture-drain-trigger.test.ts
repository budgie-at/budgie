import { Workload } from '@app/@generic/service/workload.service';
import { AppDataSyncService } from '@app/sync/service/app-data-sync.service';
import { WalletCaptureImportService } from '@app/wallet-capture/service/wallet-capture-import.service';
import { describe, expect, it, vi } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';

import { TestLayer, walletCaptureNativeStub, walletCaptureSeedAccount } from '../../harness/wallet-capture';
import { walletCaptureBuild, walletCaptureFindTransaction } from '../../harness/wallet-capture/wallet-capture-import.harness';

const CAPTURE_ID = '8e3f58ae-cd1c-45c8-91da-e54a5c8ea999';

const yieldUntil = Effect.fnUntraced(function* (condition: Effect.Effect<boolean>) {
    while (!(yield* condition)) {
        yield* Effect.yieldNow;
    }
});

describe('Wallet capture drain triggers', () => {
    it.effect('drains a capture invoked while the app is running', () =>
        Effect.gen(function* () {
            const appDataSyncService = yield* AppDataSyncService;
            const importService = yield* WalletCaptureImportService;
            const account = yield* walletCaptureSeedAccount();
            const drained = yield* Deferred.make<void>();
            const { drain } = importService;

            vi.spyOn(importService, 'drain').mockImplementation(() => drain().pipe(Effect.ensuring(Deferred.succeed(drained, undefined))));
            const watcher = yield* Effect.forkChild(appDataSyncService.drainWalletCapturesOnInvocation);
            yield* yieldUntil(Effect.sync(() => walletCaptureNativeStub.hasListeners()));

            walletCaptureNativeStub.invoke(walletCaptureBuild(CAPTURE_ID, { accountId: account.id }));
            yield* Deferred.await(drained);

            expect((yield* walletCaptureFindTransaction(CAPTURE_ID)).externalId).toBe(CAPTURE_ID);
            expect(walletCaptureNativeStub.pendingCaptureIds()).toEqual([]);
            yield* Fiber.interrupt(watcher);
            expect(walletCaptureNativeStub.hasListeners()).toBe(false);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('drains captures before network syncs even when user work is queued', () =>
        Effect.gen(function* () {
            const appDataSyncService = yield* AppDataSyncService;
            const workload = yield* Workload;
            const account = yield* walletCaptureSeedAccount();
            const release = yield* Deferred.make<void>();

            walletCaptureNativeStub.seed([walletCaptureBuild(CAPTURE_ID, { accountId: account.id })]);
            const runningUserWork = yield* Effect.forkChild(workload.runUser(Deferred.await(release)));
            const queuedUserWork = yield* Effect.forkChild(workload.runUser(Effect.void));
            yield* yieldUntil(workload.hasQueuedUserWork);

            expect(yield* appDataSyncService.sync()).toBe(false);
            expect((yield* walletCaptureFindTransaction(CAPTURE_ID)).externalId).toBe(CAPTURE_ID);
            expect(walletCaptureNativeStub.pendingCaptureIds()).toEqual([]);

            yield* Deferred.succeed(release, undefined);
            yield* Fiber.join(runningUserWork);
            yield* Fiber.join(queuedUserWork);
        }).pipe(Effect.provide(TestLayer))
    );
});
