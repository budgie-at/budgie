import { WalletCaptureReviewReasonEnum } from '@app/wallet-capture/enum/wallet-capture-review-reason.enum';
import { WalletCaptureStatusEnum } from '@app/wallet-capture/enum/wallet-capture-status.enum';
import { WalletCaptureImportService } from '@app/wallet-capture/service/wallet-capture-import.service';
import { AccountEntityTable, CategorySourceEnum, ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { RuleEngineService } from '@budgie/rules';
import { describe, expect, it, vi } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { testDb } from '../../harness/scenario/setup';
import { TestLayer } from '../../harness/scenario/test-runtime';
import { seed } from '../../harness/seed/seed';
import {
    WALLET_CAPTURE_MISSING_ACCOUNT_ID,
    walletCaptureSeedAccount,
    walletCaptureBuild,
    walletCaptureExpectRuleApplied,
    walletCaptureFindEntry,
    walletCaptureFindTransaction,
    walletCaptureForcePostCreateRulePreparation,
    walletCaptureSeedExistingTransaction,
    walletCaptureSeedInput
} from '../../harness/wallet-capture/wallet-capture-import.harness';
import { walletCaptureNativeStub } from '../../harness/wallet-capture/wallet-capture-native.stub';

import type { WalletCaptureNativeRecordInterface } from '@app/wallet-capture/interface/wallet-capture-native-record.interface';

const CAPTURE_ID = '8e3f58ae-cd1c-45c8-91da-e54a5c8ea444';
const expectCreatedCapturePending = Effect.fnUntraced(function* (capture: WalletCaptureNativeRecordInterface) {
    const transaction = yield* walletCaptureFindTransaction(capture.captureId);

    expect(transaction.externalSource).toBe(ExternalSourceEnum.APPLE_PAY_AUTOMATION);
    expect((yield* walletCaptureFindEntry(transaction.id)).categorySource).toBe(CategorySourceEnum.USER);
});

const expectUnavailableCaptureDismissed = Effect.fnUntraced(function* (capture: WalletCaptureNativeRecordInterface) {
    const walletCaptureImportService = yield* WalletCaptureImportService;
    walletCaptureNativeStub.seed([capture]);
    expect(yield* walletCaptureImportService.getReviewItems()).toEqual([
        { capture, duplicateTransactionId: null, reason: WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE }
    ]);
    yield* walletCaptureImportService.dismiss(capture.captureId);
    expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([]);
});

describe('Wallet capture import regressions', () => {
    it.effect('retries post-create rule application for an exact existing capture before acknowledging it', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const ruleEngineService = yield* RuleEngineService;
            const { capture, category } = yield* walletCaptureSeedInput(CAPTURE_ID);

            walletCaptureNativeStub.seed([capture]);
            walletCaptureForcePostCreateRulePreparation(ruleEngineService);
            vi.spyOn(ruleEngineService, 'applyRulesToTransactions').mockReturnValueOnce(Effect.die(new Error('rules unavailable')));

            expect(Exit.isFailure(yield* Effect.exit(walletCaptureImportService.drain()))).toBe(true);

            yield* expectCreatedCapturePending(capture);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([capture]);

            expect(yield* walletCaptureImportService.drain()).toEqual([]);

            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(1);
            yield* walletCaptureExpectRuleApplied(capture, category);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns and dismisses a pending capture whose account is missing from review items', () =>
        Effect.gen(function* () {
            yield* seed.instrument();
            const capture = walletCaptureBuild(CAPTURE_ID, { accountId: WALLET_CAPTURE_MISSING_ACCOUNT_ID });

            yield* expectUnavailableCaptureDismissed(capture);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns and dismisses a pending capture whose account is inactive from review items', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedAccount();
            const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });

            yield* testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, account.id));
            yield* expectUnavailableCaptureDismissed(capture);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not dismiss an arbitrary pending capture with an available account', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const account = yield* walletCaptureSeedAccount();
            const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });

            walletCaptureNativeStub.seed([capture]);

            yield* walletCaptureImportService.dismiss(capture.captureId);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([capture]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('force-imports an already-created reviewed capture without duplicating it', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const ruleEngineService = yield* RuleEngineService;
            const input = yield* walletCaptureSeedInput(CAPTURE_ID);
            const capture = walletCaptureBuild(CAPTURE_ID, {
                accountId: input.capture.accountId,
                status: WalletCaptureStatusEnum.NEEDS_REVIEW,
                duplicateTransactionId: WALLET_CAPTURE_MISSING_ACCOUNT_ID
            });

            yield* walletCaptureSeedExistingTransaction(capture);
            walletCaptureNativeStub.seed([capture]);
            walletCaptureForcePostCreateRulePreparation(ruleEngineService);

            yield* walletCaptureImportService.forceImport(capture.captureId);

            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(1);
            yield* walletCaptureExpectRuleApplied(capture, input.category);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});
