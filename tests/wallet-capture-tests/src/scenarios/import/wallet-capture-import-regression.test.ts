import { ruleEngineService } from '@app/rule/service/rule-engine.service';
import { WalletCaptureReviewReasonEnum } from '@app/wallet-capture/enum/wallet-capture-review-reason.enum';
import { WalletCaptureStatusEnum } from '@app/wallet-capture/enum/wallet-capture-status.enum';
import { walletCaptureImportService } from '@app/wallet-capture/service/wallet-capture-import.service';
import { AccountEntityTable, CategorySourceEnum, ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { walletCaptureNativeStub } from '../../harness/native/wallet-capture-native.stub';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';
import {
    WALLET_CAPTURE_MISSING_ACCOUNT_ID,
    walletCaptureBuild,
    walletCaptureExpectRuleApplied,
    walletCaptureFindEntry,
    walletCaptureFindTransaction,
    walletCaptureForcePostCreateRulePreparation,
    walletCaptureSeedExistingTransaction,
    walletCaptureSeedInput
} from '../../harness/wallet-capture/wallet-capture-import.harness';

import type { WalletCaptureNativeRecordInterface } from '@app/wallet-capture/interface/wallet-capture-native-record.interface';

const CAPTURE_ID = '8e3f58ae-cd1c-45c8-91da-e54a5c8ea444';
const expectCreatedCapturePending = (capture: WalletCaptureNativeRecordInterface): void => {
    const transaction = walletCaptureFindTransaction(capture.captureId);

    expect(transaction.externalSource).toBe(ExternalSourceEnum.APPLE_PAY_AUTOMATION);
    expect(walletCaptureFindEntry(transaction.id).categorySource).toBe(CategorySourceEnum.USER);
};

const expectUnavailableCaptureDismissed = async (capture: WalletCaptureNativeRecordInterface): Promise<void> => {
    walletCaptureNativeStub.seed([capture]);
    await expect(walletCaptureImportService.getReviewItems()).resolves.toEqual([
        { capture, duplicateTransactionId: null, reason: WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE }
    ]);
    await expect(walletCaptureImportService.dismiss(capture.captureId)).resolves.toBeUndefined();
    await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
};

describe('Wallet capture import regressions', () => {
    it('retries post-create rule application for an exact existing capture before acknowledging it', async () => {
        const { capture, category } = walletCaptureSeedInput(CAPTURE_ID);

        walletCaptureNativeStub.seed([capture]);
        walletCaptureForcePostCreateRulePreparation();
        vi.spyOn(ruleEngineService, 'applyRulesToTransactions').mockRejectedValueOnce(new Error('rules unavailable'));

        await expect(walletCaptureImportService.drain()).resolves.toEqual([]);

        expectCreatedCapturePending(capture);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([capture]);

        await expect(walletCaptureImportService.drain()).resolves.toEqual([]);

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(1);
        walletCaptureExpectRuleApplied(capture, category);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });

    it('returns and dismisses a pending capture whose account is missing from review items', async () => {
        seed.instrument();
        const capture = walletCaptureBuild(CAPTURE_ID, { accountId: WALLET_CAPTURE_MISSING_ACCOUNT_ID });

        await expectUnavailableCaptureDismissed(capture);
    });

    it('returns and dismisses a pending capture whose account is inactive from review items', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });

        testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, account.id)).run();
        await expectUnavailableCaptureDismissed(capture);
    });

    it('does not dismiss an arbitrary pending capture with an available account', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = walletCaptureBuild(CAPTURE_ID, { accountId: account.id });

        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.dismiss(capture.captureId)).resolves.toBeUndefined();
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([capture]);
    });

    it('force-imports an already-created reviewed capture without duplicating it', async () => {
        const input = walletCaptureSeedInput(CAPTURE_ID);
        const capture = walletCaptureBuild(CAPTURE_ID, {
            accountId: input.capture.accountId,
            status: WalletCaptureStatusEnum.NEEDS_REVIEW,
            duplicateTransactionId: WALLET_CAPTURE_MISSING_ACCOUNT_ID
        });

        walletCaptureSeedExistingTransaction(capture);
        walletCaptureNativeStub.seed([capture]);
        walletCaptureForcePostCreateRulePreparation();

        await expect(walletCaptureImportService.forceImport(capture.captureId)).resolves.toBeUndefined();

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(1);
        walletCaptureExpectRuleApplied(capture, input.category);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });
});
