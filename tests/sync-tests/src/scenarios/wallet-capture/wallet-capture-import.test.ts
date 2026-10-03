import { WalletCaptureReviewReasonEnum } from '@app/wallet-capture/enum/wallet-capture-review-reason.enum';
import { WalletCaptureStatusEnum } from '@app/wallet-capture/enum/wallet-capture-status.enum';
import { WalletCaptureImportService } from '@app/wallet-capture/service/wallet-capture-import.service';
import { TransactionRepository, DbError } from '@budgie/contracts';
import {
    AccountBalanceEntityTable,
    CategorySourceEnum,
    ExternalSourceEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTagsEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it, vi } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { testDb } from '../../harness/scenario/setup';
import { TestLayer } from '../../harness/scenario/test-runtime';
import { seed } from '../../harness/seed/seed';
import {
    WALLET_CAPTURE_AMOUNT,
    WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS,
    WALLET_CAPTURE_MISSING_ACCOUNT_ID,
    walletCaptureSeedAccount,
    walletCaptureBuild,
    walletCaptureFindTransaction,
    walletCaptureSeedExistingTransaction,
    walletCaptureSeedRule
} from '../../harness/wallet-capture/wallet-capture-import.harness';
import { walletCaptureNativeStub } from '../../harness/wallet-capture/wallet-capture-native.stub';

import type { WalletCaptureNativeRecordInterface } from '@app/wallet-capture/interface/wallet-capture-native-record.interface';

const CAPTURE_ID = '8e3f58ae-cd1c-45c8-91da-e54a5c8ea111';
const SAFE_CAPTURE_ID = '8e3f58ae-cd1c-45c8-91da-e54a5c8ea222';
const FAILING_CAPTURE_ID = '8e3f58ae-cd1c-45c8-91da-e54a5c8ea333';
const REVIEW_DUPLICATE_TRANSACTION_ID = 77;

const buildReviewedCapture = (accountId: number): WalletCaptureNativeRecordInterface =>
    walletCaptureBuild(CAPTURE_ID, {
        accountId,
        status: WalletCaptureStatusEnum.NEEDS_REVIEW,
        duplicateTransactionId: REVIEW_DUPLICATE_TRANSACTION_ID
    });

const seedReviewedCapture = Effect.fnUntraced(function* () {
    yield* seed.instrument();
    const account = yield* seed.account({ title: 'Wallet card' });
    const capture = buildReviewedCapture(account.id);

    walletCaptureNativeStub.seed([capture]);

    return capture;
});
const expectImportedBalanceAndTag = Effect.fnUntraced(function* (
    capture: WalletCaptureNativeRecordInterface,
    transactionId: number,
    tagId: number
) {
    const [balance] = yield* testDb
        .select()
        .from(AccountBalanceEntityTable)
        .where(eq(AccountBalanceEntityTable.accountId, capture.accountId));
    const [transactionTag] = yield* testDb
        .select()
        .from(TransactionTagsEntityTable)
        .where(eq(TransactionTagsEntityTable.transactionId, transactionId));

    expect(balance.amount).toBe(-WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS);
    expect(transactionTag.tagId).toBe(tagId);
});

const expectImportedTransaction = Effect.fnUntraced(function* (capture: WalletCaptureNativeRecordInterface) {
    const transaction = yield* walletCaptureFindTransaction(capture.captureId);
    expect(transaction.externalSource).toBe(ExternalSourceEnum.APPLE_PAY_AUTOMATION);
    expect(transaction.externalId).toBe(capture.captureId);
    expect(transaction.title).toBe('Silpo');
    expect(transaction.type).toBe(TransactionTypeEnum.EXPENSE);
    expect(transaction.fromAccountId).toBe(capture.accountId);

    return transaction.id;
});

const expectImportedCapture = Effect.fnUntraced(function* (
    capture: WalletCaptureNativeRecordInterface,
    category: { readonly id: number; readonly tagId: number }
) {
    const transactionId = yield* expectImportedTransaction(capture);
    const [entry] = yield* testDb
        .select()
        .from(TransactionEntryEntityTable)
        .where(eq(TransactionEntryEntityTable.transactionId, transactionId));

    expect(entry.type).toBe(TransactionEntryTypeEnum.CREDIT);
    expect(entry.amount).toBe(WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS);
    expect(entry.categoryId).toBe(category.id);
    expect(entry.categorySource).toBe(CategorySourceEnum.RULE);
    expect(entry.externalId).toBe(capture.captureId);
    yield* expectImportedBalanceAndTag(capture, transactionId, category.tagId);
});

describe('Wallet capture import creation', () => {
    it.effect('creates an expense, applies matching rules, and acknowledges the capture', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const account = yield* walletCaptureSeedAccount();
            const category = yield* walletCaptureSeedRule();
            const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });

            walletCaptureNativeStub.seed([capture]);

            expect(yield* walletCaptureImportService.drain()).toEqual([]);

            yield* expectImportedCapture(capture, category);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('acknowledges an already imported capture UUID without creating another transaction', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const account = yield* walletCaptureSeedAccount();
            const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });

            yield* walletCaptureSeedExistingTransaction(capture);
            walletCaptureNativeStub.seed([capture]);

            expect(yield* walletCaptureImportService.drain()).toEqual([]);

            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(1);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('propagates interruption without processing the remaining captures', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const transactionRepository = yield* TransactionRepository;
            const account = yield* walletCaptureSeedAccount();
            const records = [
                walletCaptureBuild(FAILING_CAPTURE_ID, { accountId: account.id }),
                walletCaptureBuild(SAFE_CAPTURE_ID, { accountId: account.id })
            ];
            walletCaptureNativeStub.seed(records);
            vi.spyOn(transactionRepository, 'bulkCreate').mockReturnValueOnce(Effect.interrupt);
            const result = yield* Effect.exit(walletCaptureImportService.drain());
            expect(Exit.isFailure(result) && Cause.hasInterrupts(result.cause)).toBe(true);
            expect(yield* testDb.select().from(TransactionEntityTable)).toEqual([]);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual(records);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a capture pending when transaction creation fails', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const transactionRepository = yield* TransactionRepository;
            const account = yield* walletCaptureSeedAccount();
            const safeCapture = walletCaptureBuild(SAFE_CAPTURE_ID, { accountId: account.id, merchant: 'Second merchant' });
            const failingCapture = walletCaptureBuild(FAILING_CAPTURE_ID, { accountId: account.id });

            walletCaptureNativeStub.seed([failingCapture, safeCapture]);
            vi.spyOn(transactionRepository, 'bulkCreate').mockReturnValueOnce(
                Effect.fail(new DbError({ cause: new Error('database unavailable') }))
            );

            expect(Exit.isFailure(yield* Effect.exit(walletCaptureImportService.drain()))).toBe(true);

            expect((yield* walletCaptureFindTransaction(safeCapture.captureId)).externalId).toBe(safeCapture.captureId);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([failingCapture]);
            expect(yield* walletCaptureImportService.drain()).toEqual([]);
            expect((yield* walletCaptureFindTransaction(failingCapture.captureId)).externalId).toBe(failingCapture.captureId);
            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(2);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('Wallet capture import review', () => {
    it.effect('marks a nearby semantic duplicate for review without creating it', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const account = yield* walletCaptureSeedAccount();
            const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });
            const existingTransaction = yield* seed.bankPairExpense(
                { externalId: 'existing-wallet-candidate', operatedAt: new Date('2026-08-07T10:01:30.000Z') },
                { accountId: account.id, amount: WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS, mccCategoryId: null }
            );

            yield* seed.updateTransaction(existingTransaction.id, {
                externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
                title: ' silpo '
            });
            walletCaptureNativeStub.seed([capture]);

            expect(yield* walletCaptureImportService.drain()).toEqual([
                { capture, duplicateTransactionId: existingTransaction.id, reason: WalletCaptureReviewReasonEnum.DUPLICATE }
            ]);

            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(1);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([
                { ...capture, status: WalletCaptureStatusEnum.NEEDS_REVIEW, duplicateTransactionId: existingTransaction.id }
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('imports a reviewed duplicate when forceImport is called', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const capture = yield* seedReviewedCapture();

            yield* walletCaptureImportService.forceImport(capture.captureId);

            expect((yield* walletCaptureFindTransaction(capture.captureId)).externalSource).toBe(ExternalSourceEnum.APPLE_PAY_AUTOMATION);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('dismisses a reviewed duplicate without creating it', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const capture = yield* seedReviewedCapture();

            yield* walletCaptureImportService.dismiss(capture.captureId);

            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(0);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('Wallet capture import preservation', () => {
    it.effect('keeps a capture pending when its account no longer exists', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            yield* seed.instrument();
            const capture = walletCaptureBuild(CAPTURE_ID, { accountId: WALLET_CAPTURE_MISSING_ACCOUNT_ID });

            walletCaptureNativeStub.seed([capture]);

            expect(yield* walletCaptureImportService.drain()).toEqual([
                { capture, duplicateTransactionId: null, reason: WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE }
            ]);

            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(0);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([capture]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports invalid native payloads without acknowledging inbox data', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const account = yield* walletCaptureSeedAccount();
            const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });
            const invalidCapture = { ...capture, amount: -WALLET_CAPTURE_AMOUNT };

            walletCaptureNativeStub.seed([invalidCapture]);

            expect(Exit.isFailure(yield* Effect.exit(walletCaptureImportService.drain()))).toBe(true);
            expect(yield* Effect.promise(() => walletCaptureNativeStub.getCaptures())).toEqual([invalidCapture]);
        }).pipe(Effect.provide(TestLayer))
    );
});
