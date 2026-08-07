import { ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { accountService } from '../../account/service/account.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { WalletCaptureReviewReasonEnum } from '../enum/wallet-capture-review-reason.enum';
import { WalletCaptureStatusEnum } from '../enum/wallet-capture-status.enum';

import { walletCaptureNativeService } from './wallet-capture-native.service';
import { walletCaptureTransactionService } from './wallet-capture-transaction.service';

import type { WalletCaptureNativeRecordInterface } from '../interface/wallet-capture-native-record.interface';
import type { WalletCaptureReviewItemInterface } from '../interface/wallet-capture-review-item.interface';

class WalletCaptureImportService {
    private static readonly SEMANTIC_DUPLICATE_WINDOW_SECONDS = 60 * 2;
    private drainPromise: Promise<WalletCaptureReviewItemInterface[]> | null = null;

    @Log(
        'enter',
        result => `done reviewCount=${result.length} captureIds=${result.map(item => item.capture.captureId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    drain(): Promise<WalletCaptureReviewItemInterface[]> {
        this.drainPromise ??= this.drainInner().finally(() => {
            this.drainPromise = null;
        });

        return this.drainPromise;
    }

    @Log(
        captureId => `enter captureId="${captureId}"`,
        (_result, captureId) => `done captureId="${captureId}"`,
        (error, captureId) => `throw captureId="${captureId}" error=${getErrorMessage(error)}`
    )
    async forceImport(captureId: string): Promise<void> {
        const records = await walletCaptureNativeService.getCaptures();
        const record = records.find(capture => capture.captureId === captureId && capture.status === WalletCaptureStatusEnum.NEEDS_REVIEW);

        if (!isDefined(record)) {
            return;
        }

        const importedTransactionIdsByExternalId = await transactionService.findIdMapByExternalSource(
            ExternalSourceEnum.APPLE_PAY_AUTOMATION
        );
        const importedTransactionId = importedTransactionIdsByExternalId.get(record.captureId);

        if (isDefined(importedTransactionId)) {
            await this.applyRulesToExistingAndAcknowledgeCapture(record, importedTransactionId);

            return;
        }

        await this.createAndAcknowledgeCapture(record);
    }

    @Log(
        captureId => `enter captureId="${captureId}"`,
        (_result, captureId) => `done captureId="${captureId}"`,
        (error, captureId) => `throw captureId="${captureId}" error=${getErrorMessage(error)}`
    )
    async dismiss(captureId: string): Promise<void> {
        const records = await walletCaptureNativeService.getCaptures();
        const record = records.find(capture => capture.captureId === captureId);
        const reviewItem = isDefined(record) ? await this.resolveReviewItem(record) : null;

        if (isDefined(reviewItem)) {
            await walletCaptureNativeService.acknowledgeCaptures([reviewItem.capture.captureId]);
        }
    }

    @Log(
        'enter',
        result => `done reviewCount=${result.length} captureIds=${result.map(item => item.capture.captureId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getReviewItems(): Promise<WalletCaptureReviewItemInterface[]> {
        const records = await walletCaptureNativeService.getCaptures();

        return records.reduce<Promise<WalletCaptureReviewItemInterface[]>>(async (reviewItemsPromise, record) => {
            const reviewItems = await reviewItemsPromise;
            const reviewItem = await this.resolveReviewItem(record);

            if (!isDefined(reviewItem)) {
                return reviewItems;
            }

            return [...reviewItems, reviewItem];
        }, Promise.resolve([]));
    }

    @Log(
        'enter',
        result => `done reviewCount=${result.length} captureIds=${result.map(item => item.capture.captureId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async drainInner(): Promise<WalletCaptureReviewItemInterface[]> {
        const records = await walletCaptureNativeService.getCaptures();
        const importedTransactionIdsByExternalId = await transactionService.findIdMapByExternalSource(
            ExternalSourceEnum.APPLE_PAY_AUTOMATION
        );

        return records.reduce<Promise<WalletCaptureReviewItemInterface[]>>(async (reviewItemsPromise, record) => {
            const reviewItems = await reviewItemsPromise;
            const reviewItem = await this.processCapture(record, importedTransactionIdsByExternalId);

            if (!isDefined(reviewItem)) {
                return reviewItems;
            }

            return [...reviewItems, reviewItem];
        }, Promise.resolve([]));
    }

    @Log(
        (record, importedTransactionIdsByExternalId) =>
            `enter captureId="${record.captureId}" accountId=${record.accountId} status=${record.status} importedCount=${importedTransactionIdsByExternalId.size}`,
        (result, record, importedTransactionIdsByExternalId) =>
            `done captureId="${record.captureId}" accountId=${record.accountId} status=${record.status} importedCount=${importedTransactionIdsByExternalId.size} hasReview=${String(isDefined(result))}`,
        (error, record, importedTransactionIdsByExternalId) =>
            `throw captureId="${record.captureId}" accountId=${record.accountId} status=${record.status} importedCount=${importedTransactionIdsByExternalId.size} error=${getErrorMessage(error)}`
    )
    private async processCapture(
        record: WalletCaptureNativeRecordInterface,
        importedTransactionIdsByExternalId: Map<string, number>
    ): Promise<WalletCaptureReviewItemInterface | null> {
        const importedTransactionId = importedTransactionIdsByExternalId.get(record.captureId);

        if (isDefined(importedTransactionId)) {
            await this.tryApplyRulesToExistingAndAcknowledgeCapture(record, importedTransactionId);

            return null;
        }

        if (record.status === WalletCaptureStatusEnum.NEEDS_REVIEW) {
            return {
                capture: record,
                duplicateTransactionId: record.duplicateTransactionId,
                reason: isDefined(record.duplicateTransactionId)
                    ? WalletCaptureReviewReasonEnum.DUPLICATE
                    : WalletCaptureReviewReasonEnum.INVALID_PAYLOAD
            };
        }

        return this.processPendingCapture(record);
    }

    @Log(
        record =>
            `enter pendingCaptureId="${record.captureId}" amount=${record.amount} merchant="${record.merchant}" accountId=${record.accountId}`,
        (result, record) =>
            `done pendingCaptureId="${record.captureId}" amount=${record.amount} merchant="${record.merchant}" accountId=${record.accountId} reviewReason=${result?.reason ?? ''}`,
        (error, record) =>
            `throw pendingCaptureId="${record.captureId}" amount=${record.amount} merchant="${record.merchant}" accountId=${record.accountId} error=${getErrorMessage(error)}`
    )
    private async processPendingCapture(record: WalletCaptureNativeRecordInterface): Promise<WalletCaptureReviewItemInterface | null> {
        const unavailableAccountReview = await this.findUnavailableAccountReview(record);

        if (isDefined(unavailableAccountReview)) {
            return unavailableAccountReview;
        }

        const duplicateTransactionId = await this.findDuplicateTransactionId(record);

        if (isDefined(duplicateTransactionId)) {
            await walletCaptureNativeService.markNeedsReview(record.captureId, duplicateTransactionId);

            return {
                capture: record,
                duplicateTransactionId,
                reason: WalletCaptureReviewReasonEnum.DUPLICATE
            };
        }

        return this.tryCreateAndAcknowledgeCapture(record);
    }

    @Log(
        record => `enter accountLookupCaptureId="${record.captureId}" accountId=${record.accountId} capturedAt=${record.capturedAt}`,
        (result, record) =>
            `done accountLookupCaptureId="${record.captureId}" accountId=${record.accountId} capturedAt=${record.capturedAt} unavailable=${String(isDefined(result))}`,
        (error, record) =>
            `throw accountLookupCaptureId="${record.captureId}" accountId=${record.accountId} capturedAt=${record.capturedAt} error=${getErrorMessage(error)}`
    )
    private async findUnavailableAccountReview(
        record: WalletCaptureNativeRecordInterface
    ): Promise<WalletCaptureReviewItemInterface | null> {
        try {
            const account = await accountService.findByIdOrFail(record.accountId);

            if (!account.isActive) {
                return this.createUnavailableAccountReview(record);
            }

            return null;
        } catch (error) {
            if (getErrorMessage(error) === `Account with id ${record.accountId} not found`) {
                return this.createUnavailableAccountReview(record);
            }

            throw error;
        }
    }

    @Log(
        record => `enter duplicateLookupCaptureId="${record.captureId}" merchant="${record.merchant}" amount=${record.amount}`,
        (result, record) =>
            `done duplicateLookupCaptureId="${record.captureId}" merchant="${record.merchant}" amount=${record.amount} duplicateTransactionId=${result ?? ''}`,
        (error, record) =>
            `throw duplicateLookupCaptureId="${record.captureId}" merchant="${record.merchant}" amount=${record.amount} error=${getErrorMessage(error)}`
    )
    private async findDuplicateTransactionId(record: WalletCaptureNativeRecordInterface): Promise<number | null> {
        return transactionRepository.findPotentialExpenseDuplicate({
            accountId: record.accountId,
            amountInMicroUnits: convertToMicroUnits(record.amount),
            normalizedTitle: record.merchant.trim().toLocaleLowerCase(),
            operatedAt: new Date(record.capturedAt),
            timeWindowSeconds: WalletCaptureImportService.SEMANTIC_DUPLICATE_WINDOW_SECONDS
        });
    }

    @Log(
        record => `enter createAttemptCaptureId="${record.captureId}" status=${record.status} accountId=${record.accountId}`,
        (result, record) =>
            `done createAttemptCaptureId="${record.captureId}" status=${record.status} accountId=${record.accountId} reviewReason=${result?.reason ?? ''}`,
        (error, record) =>
            `throw createAttemptCaptureId="${record.captureId}" status=${record.status} accountId=${record.accountId} error=${getErrorMessage(error)}`
    )
    private async tryCreateAndAcknowledgeCapture(
        record: WalletCaptureNativeRecordInterface
    ): Promise<WalletCaptureReviewItemInterface | null> {
        try {
            await this.createAndAcknowledgeCapture(record);
        } catch {
            return null;
        }

        return null;
    }

    @Log(
        record => `enter createCaptureId="${record.captureId}" merchant="${record.merchant}" accountId=${record.accountId}`,
        (_result, record) => `done createCaptureId="${record.captureId}" merchant="${record.merchant}" accountId=${record.accountId}`,
        (error, record) =>
            `throw createCaptureId="${record.captureId}" merchant="${record.merchant}" accountId=${record.accountId} error=${getErrorMessage(error)}`
    )
    private async createAndAcknowledgeCapture(record: WalletCaptureNativeRecordInterface): Promise<void> {
        await walletCaptureTransactionService.createCaptureTransaction(record);
        await walletCaptureNativeService.acknowledgeCaptures([record.captureId]);
    }

    @Log(
        (record, transactionId) =>
            `enter retryRulesCaptureId="${record.captureId}" accountId=${record.accountId} transactionId=${transactionId}`,
        (_result, record, transactionId) =>
            `done retryRulesCaptureId="${record.captureId}" accountId=${record.accountId} transactionId=${transactionId}`,
        (error, record, transactionId) =>
            `throw retryRulesCaptureId="${record.captureId}" accountId=${record.accountId} transactionId=${transactionId} error=${getErrorMessage(error)}`
    )
    private async tryApplyRulesToExistingAndAcknowledgeCapture(
        record: WalletCaptureNativeRecordInterface,
        transactionId: number
    ): Promise<void> {
        await this.applyRulesToExistingAndAcknowledgeCapture(record, transactionId).catch(() => null);
    }

    @Log(
        (record, transactionId) =>
            `enter applyRulesCaptureId="${record.captureId}" merchant="${record.merchant}" transactionId=${transactionId}`,
        (_result, record, transactionId) =>
            `done applyRulesCaptureId="${record.captureId}" merchant="${record.merchant}" transactionId=${transactionId}`,
        (error, record, transactionId) =>
            `throw applyRulesCaptureId="${record.captureId}" merchant="${record.merchant}" transactionId=${transactionId} error=${getErrorMessage(error)}`
    )
    private async applyRulesToExistingAndAcknowledgeCapture(
        record: WalletCaptureNativeRecordInterface,
        transactionId: number
    ): Promise<void> {
        await walletCaptureTransactionService.applyRulesToExistingCaptureTransaction(record, transactionId);
        await walletCaptureNativeService.acknowledgeCaptures([record.captureId]);
    }

    private async resolveReviewItem(record: WalletCaptureNativeRecordInterface): Promise<WalletCaptureReviewItemInterface | null> {
        if (record.status === WalletCaptureStatusEnum.NEEDS_REVIEW) {
            return {
                capture: record,
                duplicateTransactionId: record.duplicateTransactionId,
                reason: isDefined(record.duplicateTransactionId)
                    ? WalletCaptureReviewReasonEnum.DUPLICATE
                    : WalletCaptureReviewReasonEnum.INVALID_PAYLOAD
            };
        }

        return this.findUnavailableAccountReview(record);
    }

    private createUnavailableAccountReview(record: WalletCaptureNativeRecordInterface): WalletCaptureReviewItemInterface {
        return {
            capture: record,
            duplicateTransactionId: null,
            reason: WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE
        };
    }
}

export const walletCaptureImportService = new WalletCaptureImportService();
