import { transactionRepository } from '@app/@generic/drizzle/db/db';
import { WalletCaptureReviewReasonEnum } from '@app/wallet-capture/enum/wallet-capture-review-reason.enum';
import { WalletCaptureStatusEnum } from '@app/wallet-capture/enum/wallet-capture-status.enum';
import { walletCaptureImportService } from '@app/wallet-capture/service/wallet-capture-import.service';
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
import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { walletCaptureNativeStub } from '../../harness/native/wallet-capture-native.stub';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';
import {
    WALLET_CAPTURE_AMOUNT,
    WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS,
    WALLET_CAPTURE_MISSING_ACCOUNT_ID,
    walletCaptureBuild,
    walletCaptureFindTransaction,
    walletCaptureSeedExistingTransaction,
    walletCaptureSeedRule
} from '../../harness/wallet-capture/wallet-capture-import.harness';

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

const seedReviewedCapture = (): WalletCaptureNativeRecordInterface => {
    seed.instrument();
    const account = seed.account({ title: 'Wallet card' });
    const capture = buildReviewedCapture(account.id);

    walletCaptureNativeStub.seed([capture]);

    return capture;
};
const expectImportedBalanceAndTag = (capture: WalletCaptureNativeRecordInterface, transactionId: number, tagId: number): void => {
    const [balance] = testDb
        .select()
        .from(AccountBalanceEntityTable)
        .where(eq(AccountBalanceEntityTable.accountId, capture.accountId))
        .all();
    const [transactionTag] = testDb
        .select()
        .from(TransactionTagsEntityTable)
        .where(eq(TransactionTagsEntityTable.transactionId, transactionId))
        .all();

    expect(balance.amount).toBe(-WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS);
    expect(transactionTag.tagId).toBe(tagId);
};

const expectImportedTransaction = (capture: WalletCaptureNativeRecordInterface): number => {
    const transaction = walletCaptureFindTransaction(capture.captureId);
    expect(transaction.externalSource).toBe(ExternalSourceEnum.APPLE_PAY_AUTOMATION);
    expect(transaction.externalId).toBe(capture.captureId);
    expect(transaction.title).toBe('Silpo');
    expect(transaction.type).toBe(TransactionTypeEnum.EXPENSE);
    expect(transaction.fromAccountId).toBe(capture.accountId);

    return transaction.id;
};

const expectImportedCapture = (
    capture: WalletCaptureNativeRecordInterface,
    category: { readonly id: number; readonly tagId: number }
): void => {
    const transactionId = expectImportedTransaction(capture);
    const [entry] = testDb
        .select()
        .from(TransactionEntryEntityTable)
        .where(eq(TransactionEntryEntityTable.transactionId, transactionId))
        .all();

    expect(entry.type).toBe(TransactionEntryTypeEnum.CREDIT);
    expect(entry.amount).toBe(WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS);
    expect(entry.categoryId).toBe(category.id);
    expect(entry.categorySource).toBe(CategorySourceEnum.RULE);
    expect(entry.externalId).toBe(capture.captureId);
    expectImportedBalanceAndTag(capture, transactionId, category.tagId);
};

describe('Wallet capture import creation', () => {
    it('creates an expense, applies matching rules, and acknowledges the capture', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const category = walletCaptureSeedRule();
        const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });

        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.drain()).resolves.toEqual([]);

        expectImportedCapture(capture, category);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });

    it('acknowledges an already imported capture UUID without creating another transaction', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });

        walletCaptureSeedExistingTransaction(capture);
        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.drain()).resolves.toEqual([]);

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(1);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });

    it('keeps a capture pending when transaction creation fails', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const safeCapture = walletCaptureBuild(SAFE_CAPTURE_ID, { accountId: account.id });
        const failingCapture = walletCaptureBuild(FAILING_CAPTURE_ID, { accountId: account.id });

        walletCaptureNativeStub.seed([failingCapture, safeCapture]);
        vi.spyOn(transactionRepository, 'bulkCreate').mockRejectedValueOnce(new Error('database unavailable'));

        await expect(walletCaptureImportService.drain()).resolves.toEqual([]);

        expect(walletCaptureFindTransaction(safeCapture.captureId).externalId).toBe(safeCapture.captureId);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([failingCapture]);
    });
});

describe('Wallet capture import review', () => {
    it('marks a nearby semantic duplicate for review without creating it', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });
        const existingTransaction = seed.bankPairExpense(
            { externalId: 'existing-wallet-candidate', operatedAt: new Date('2026-08-07T10:01:30.000Z') },
            { accountId: account.id, amount: WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS, mccCategoryId: null }
        );

        seed.updateTransaction(existingTransaction.id, {
            externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
            title: ' silpo '
        });
        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.drain()).resolves.toEqual([
            { capture, duplicateTransactionId: existingTransaction.id, reason: WalletCaptureReviewReasonEnum.DUPLICATE }
        ]);

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(1);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([
            { ...capture, status: WalletCaptureStatusEnum.NEEDS_REVIEW, duplicateTransactionId: existingTransaction.id }
        ]);
    });

    it('imports a reviewed duplicate when forceImport is called', async () => {
        const capture = seedReviewedCapture();

        await expect(walletCaptureImportService.forceImport(capture.captureId)).resolves.toBeUndefined();

        expect(walletCaptureFindTransaction(capture.captureId).externalSource).toBe(ExternalSourceEnum.APPLE_PAY_AUTOMATION);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });

    it('dismisses a reviewed duplicate without creating it', async () => {
        const capture = seedReviewedCapture();

        await expect(walletCaptureImportService.dismiss(capture.captureId)).resolves.toBeUndefined();

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(0);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });
});

describe('Wallet capture import preservation', () => {
    it('keeps a capture pending when its account no longer exists', async () => {
        seed.instrument();
        const capture = walletCaptureBuild(CAPTURE_ID, { accountId: WALLET_CAPTURE_MISSING_ACCOUNT_ID });

        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.drain()).resolves.toEqual([
            { capture, duplicateTransactionId: null, reason: WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE }
        ]);

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(0);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([capture]);
    });

    it('reports invalid native payloads without acknowledging inbox data', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });
        const invalidCapture = { ...capture, amount: -WALLET_CAPTURE_AMOUNT };

        walletCaptureNativeStub.seed([invalidCapture]);

        await expect(walletCaptureImportService.drain()).rejects.toThrow();
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([invalidCapture]);
    });
});
