import { Workload } from '@app/@generic/service/workload.service';
import { AppDataSyncService } from '@app/sync/service/app-data-sync.service';
import { WalletCaptureReactivityKeyEnum } from '@app/wallet-capture/enum/wallet-capture-reactivity-key.enum';
import { WalletCaptureReviewReasonEnum } from '@app/wallet-capture/enum/wallet-capture-review-reason.enum';
import { WalletCaptureImportService } from '@app/wallet-capture/service/wallet-capture-import.service';
import { WalletCaptureNativeService } from '@app/wallet-capture/service/wallet-capture-native.service';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Queue from 'effect/Queue';
import * as Reactivity from 'effect/reactivity/Reactivity';
import { vi } from 'vitest';

import { TestLayer, walletCaptureNativeStub } from '../../harness/wallet-capture';
import { WALLET_CAPTURE_MISSING_ACCOUNT_ID, walletCaptureBuild } from '../../harness/wallet-capture/wallet-capture-import.harness';

const capture = walletCaptureBuild('8e3f58ae-cd1c-45c8-91da-e54a5c8ea888', { accountId: WALLET_CAPTURE_MISSING_ACCOUNT_ID });

const accountUnavailableReview = [{ capture, duplicateTransactionId: null, reason: WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE }];

const subscribeToReview = Effect.fnUntraced(function* () {
    const importService = yield* WalletCaptureImportService;
    const reactivity = yield* Reactivity.Reactivity;
    const notification = vi.fn();
    yield* Effect.acquireRelease(
        Effect.sync(() => reactivity.registerUnsafe([WalletCaptureReactivityKeyEnum.CAPTURES], notification)),
        unsubscribe => Effect.sync(unsubscribe)
    );
    const results = yield* reactivity.query([WalletCaptureReactivityKeyEnum.CAPTURES], importService.getReviewItems());
    expect(yield* Queue.take(results)).toEqual([]);
    return { notification, results };
});

describe('Wallet native review reactivity', () => {
    it.effect('refreshes an existing native-store subscription on bank-free foreground sync without any account write', () =>
        Effect.gen(function* () {
            const { notification, results } = yield* subscribeToReview();
            const appDataSyncService = yield* AppDataSyncService;
            const workload = yield* Workload;
            walletCaptureNativeStub.seed([capture]);
            yield* workload.run(appDataSyncService.sync());
            expect(notification).toHaveBeenCalledTimes(1);
            expect(yield* Queue.take(results)).toEqual(accountUnavailableReview);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('refreshes the native query even when the drain fails before processing external captures', () =>
        Effect.gen(function* () {
            const { notification, results } = yield* subscribeToReview();
            const importService = yield* WalletCaptureImportService;
            const nativeService = yield* WalletCaptureNativeService;
            walletCaptureNativeStub.seed([capture]);
            vi.spyOn(nativeService, 'getCaptures').mockReturnValueOnce(Effect.die(new Error('native store unavailable')));
            expect(Exit.isFailure(yield* Effect.exit(importService.drain()))).toBe(true);
            expect(notification).toHaveBeenCalledTimes(1);
            expect(yield* Queue.take(results)).toEqual(accountUnavailableReview);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('refreshes native-only review mutations and an empty drain without recursively invalidating reads', () =>
        Effect.gen(function* () {
            const { notification, results } = yield* subscribeToReview();
            const nativeService = yield* WalletCaptureNativeService;
            const importService = yield* WalletCaptureImportService;
            walletCaptureNativeStub.seed([capture]);
            yield* nativeService.markNeedsReview(capture.captureId, 77);
            expect(notification).toHaveBeenCalledTimes(1);
            expect((yield* Queue.take(results))[0]).toMatchObject({
                duplicateTransactionId: 77,
                reason: WalletCaptureReviewReasonEnum.DUPLICATE
            });
            yield* nativeService.acknowledgeCaptures([capture.captureId]);
            expect(notification).toHaveBeenCalledTimes(2);
            expect(yield* Queue.take(results)).toEqual([]);
            yield* importService.drain();
            expect(notification).toHaveBeenCalledTimes(3);
            expect(yield* Queue.take(results)).toEqual([]);
            yield* Effect.yieldNow;
            expect(notification).toHaveBeenCalledTimes(3);
        }).pipe(Effect.provide(TestLayer))
    );
});
