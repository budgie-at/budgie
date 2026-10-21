import { WalletCaptureReviewReasonEnum } from '@app/wallet-capture/enum/wallet-capture-review-reason.enum';
import { WalletCaptureImportService } from '@app/wallet-capture/service/wallet-capture-import.service';
import {
    CategorySourceEnum,
    CurrencyEnum,
    ExternalSourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable
} from '@budgie/contracts';
import { MonobankSyncService, TransferConsolidationDrainerService, TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it, vi } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { requireInstrument } from '../../harness/db/require-instrument';
import { buildMonobank } from '../../harness/monobank/build-monobank';
import { monobankStub } from '../../harness/monobank/monobank-stub';
import { testDb } from '../../harness/scenario/setup';
import { TestLayer } from '../../harness/scenario/test-runtime';
import { walletCaptureNativeStub } from '../../harness/wallet-capture/wallet-capture-app-intents.stub';
import { walletCaptureSeedMonobankAccount } from '../../harness/wallet-capture/wallet-capture-bank-account.harness';
import { walletCaptureSeedHistoricalRate } from '../../harness/wallet-capture/wallet-capture-historical-rate.harness';
import {
    walletCaptureFindEntry,
    walletCaptureFindTransaction,
    walletCaptureSeedRule
} from '../../harness/wallet-capture/wallet-capture-import.harness';
import { walletCaptureRawInvocation } from '../../harness/wallet-capture/wallet-capture-raw-invocation.harness';

const CAPTURE_ID = '8E3F58AE-CD1C-45C8-91DA-E54A5C8EA111';
const SECOND_CAPTURE_ID = '8E3F58AE-CD1C-45C8-91DA-E54A5C8EA222';
const BANK_EXTERNAL_ID = 'bank-silpo-1';
const CAPTURED_AT = new Date('2026-08-07T10:00:00.000Z');
const BANK_AT_SECONDS = Math.floor(CAPTURED_AT.getTime() / 1000) + 30;
const BANK_AMOUNT = 12500;
const EURO_RATE = 44.5;
const BANK_AMOUNT_WITHIN_THREE_PERCENT = 45800;
const BANK_AMOUNT_FOUR_PERCENT_OFF = 46300;
const SYNC_FROM = new Date('2026-08-01T00:00:00.000Z');

const drainCapture = Effect.fnUntraced(function* (
    accountId: number,
    captureId: string = CAPTURE_ID,
    overrides: Readonly<Record<string, string>> = {}
) {
    const walletCaptureImportService = yield* WalletCaptureImportService;

    walletCaptureNativeStub.seedInvocations([walletCaptureRawInvocation(captureId, accountId, overrides)]);

    return yield* walletCaptureImportService.drain();
});

const syncBankExpense = Effect.fnUntraced(function* (amountInMinorUnits: number, timeSeconds: number = BANK_AT_SECONDS) {
    const monobankSyncService = yield* MonobankSyncService;

    monobankStub.statement([
        buildMonobank.transaction({
            id: BANK_EXTERNAL_ID,
            amount: -amountInMinorUnits,
            hold: false,
            time: timeSeconds,
            description: 'Silpo'
        })
    ]);
    yield* monobankSyncService.sync();
});

const consolidate = Effect.fnUntraced(function* () {
    const transferConsolidationService = yield* TransferConsolidationService;

    return yield* transferConsolidationService.consolidate(null);
});

const syncEuroCaptureThenBankExpense = Effect.fnUntraced(function* (bankAmountInMinorUnits: number) {
    const account = yield* walletCaptureSeedMonobankAccount(SYNC_FROM);
    const euro = yield* requireInstrument(CurrencyEnum.EUR);

    yield* walletCaptureSeedHistoricalRate(euro.id, account.instrumentId, EURO_RATE, '2026-08-07');
    yield* drainCapture(account.id, CAPTURE_ID, { amount: '10', currency: '"EUR"' });
    yield* syncBankExpense(bankAmountInMinorUnits);
    yield* consolidate();
});

const fetchBankTransaction = Effect.fnUntraced(function* () {
    const [bankTransaction] = yield* testDb
        .select()
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.MONOBANK));

    return bankTransaction;
});

const expectMerged = Effect.fnUntraced(function* () {
    const bankTransaction = yield* fetchBankTransaction();
    const captureTransaction = yield* walletCaptureFindTransaction(CAPTURE_ID);

    expect(bankTransaction.consolidationType).toBe(TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE);
    expect(bankTransaction.consolidationParentTransactionId).toBeNull();
    expect(captureTransaction.consolidationParentTransactionId).toBe(bankTransaction.id);

    return { bankTransaction, captureTransaction };
});

const drainParkedSecondCapture = Effect.fnUntraced(function* () {
    const walletCaptureImportService = yield* WalletCaptureImportService;
    const reviewItems = yield* walletCaptureImportService.drain();

    expect(reviewItems.map(item => item.reason)).toEqual([WalletCaptureReviewReasonEnum.DUPLICATE]);
    expect(walletCaptureNativeStub.pendingCaptureIds()).toEqual([SECOND_CAPTURE_ID]);
    expect(yield* walletCaptureFindTransaction(SECOND_CAPTURE_ID)).toBeUndefined();

    return reviewItems;
});

const expectNotMerged = Effect.fnUntraced(function* () {
    const bankTransaction = yield* fetchBankTransaction();
    const captureTransaction = yield* walletCaptureFindTransaction(CAPTURE_ID);

    expect(bankTransaction.consolidationType).toBeNull();
    expect(captureTransaction.consolidationParentTransactionId).toBeNull();
    expect(captureTransaction.consolidationType).toBeNull();
});

describe('wallet-capture/bank-consolidation', () => {
    it.effect('enqueues a consolidation scope containing every imported capture transaction id', () =>
        Effect.gen(function* () {
            const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
            const account = yield* walletCaptureSeedMonobankAccount(SYNC_FROM);

            expect(yield* drainCapture(account.id)).toEqual([]);

            const captureTransaction = yield* walletCaptureFindTransaction(CAPTURE_ID);

            expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledTimes(1);
            expect(vi.mocked(transferConsolidationDrainerService.enqueue)).toHaveBeenCalledWith(
                expect.objectContaining({ transactionIds: [captureTransaction.id] })
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('merges a capture imported first into the later Monobank row, which survives and carries the capture rule category', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedMonobankAccount(SYNC_FROM);
            const category = yield* walletCaptureSeedRule();

            yield* drainCapture(account.id);
            yield* syncBankExpense(BANK_AMOUNT);
            yield* consolidate();

            const { bankTransaction } = yield* expectMerged();
            const bankEntry = yield* walletCaptureFindEntry(bankTransaction.id);

            expect(bankEntry.categoryId).toBe(category.id);
            expect(bankEntry.categorySource).toBe(CategorySourceEnum.RULE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('merges a capture imported after an existing Monobank row into that row', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedMonobankAccount(SYNC_FROM);

            yield* syncBankExpense(BANK_AMOUNT);

            expect(yield* drainCapture(account.id)).toEqual([]);

            yield* consolidate();
            yield* expectMerged();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('merges a EUR capture converted at 44.5 into a UAH bank row within 3 percent of the converted amount', () =>
        Effect.gen(function* () {
            yield* syncEuroCaptureThenBankExpense(BANK_AMOUNT_WITHIN_THREE_PERCENT);

            yield* expectMerged();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not merge a EUR capture into a UAH bank row 4 percent away from the converted amount', () =>
        Effect.gen(function* () {
            yield* syncEuroCaptureThenBankExpense(BANK_AMOUNT_FOUR_PERCENT_OFF);

            yield* expectNotMerged();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('imports a capture whose title and amount match a bank row within 120 seconds and merges it by consolidation', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedMonobankAccount(SYNC_FROM);

            yield* syncBankExpense(BANK_AMOUNT, BANK_AT_SECONDS - 20);

            expect(yield* drainCapture(account.id)).toEqual([]);
            expect((yield* walletCaptureFindTransaction(CAPTURE_ID)).externalSource).toBe(ExternalSourceEnum.APPLE_PAY_AUTOMATION);

            yield* consolidate();
            yield* expectMerged();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('still flags a second capture with the same merchant and amount as a DUPLICATE review', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedMonobankAccount(SYNC_FROM);

            yield* drainCapture(account.id);
            const first = yield* walletCaptureFindTransaction(CAPTURE_ID);
            const reviewItems = yield* drainCapture(account.id, SECOND_CAPTURE_ID);

            expect(reviewItems.map(item => item.reason)).toEqual([WalletCaptureReviewReasonEnum.DUPLICATE]);
            expect(reviewItems.map(item => item.duplicateTransactionId)).toEqual([first.id]);
            expect(walletCaptureNativeStub.pendingCaptureIds()).toEqual([SECOND_CAPTURE_ID]);
            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a parked DUPLICATE capture parked after the first capture merges into a Monobank row', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedMonobankAccount(SYNC_FROM);

            yield* drainCapture(account.id);
            yield* drainCapture(account.id, SECOND_CAPTURE_ID);
            yield* syncBankExpense(BANK_AMOUNT);
            yield* consolidate();

            const { bankTransaction } = yield* expectMerged();
            const reviewItems = yield* drainParkedSecondCapture();

            expect(reviewItems.map(item => item.duplicateTransactionId)).toEqual([bankTransaction.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('flags a capture arriving after the first capture merged into a Monobank row as a DUPLICATE of that row', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedMonobankAccount(SYNC_FROM);

            yield* drainCapture(account.id);
            yield* syncBankExpense(BANK_AMOUNT);
            yield* consolidate();

            const { bankTransaction } = yield* expectMerged();
            const reviewItems = yield* drainCapture(account.id, SECOND_CAPTURE_ID);

            expect(reviewItems.map(item => [item.reason, item.duplicateTransactionId])).toEqual([
                [WalletCaptureReviewReasonEnum.DUPLICATE, bankTransaction.id]
            ]);
        }).pipe(Effect.provide(TestLayer))
    );
});
