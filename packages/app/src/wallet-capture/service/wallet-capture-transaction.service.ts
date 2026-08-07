import { CategorySourceEnum, ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ruleEngineService } from '../../rule/service/rule-engine.service';
import { transactionService } from '../../transaction/service/transaction.service';

import type { WalletCaptureNativeRecordInterface } from '../interface/wallet-capture-native-record.interface';
import type { TransactionCreateInputInterface, TransactionEntityInterface } from '@budgie/contracts';

class WalletCaptureTransactionService {
    @Log(
        record => `enter captureId="${record.captureId}" accountId=${record.accountId}`,
        (result, record) =>
            `done captureId="${record.captureId}" accountId=${record.accountId} transactionIds=${result.map(row => row.id).join(',')}`,
        (error, record) => `throw captureId="${record.captureId}" accountId=${record.accountId} error=${getErrorMessage(error)}`
    )
    async createCaptureTransaction(record: WalletCaptureNativeRecordInterface): Promise<TransactionEntityInterface[]> {
        const input = this.mapCaptureToTransactionInput(record);
        const prepared = await ruleEngineService.prepareCreateInputsForRules([input]);
        const createdTransactions = await transactionService.bulkCreate(prepared.transactionInputs);
        const postCreateTransactionIds = prepared.postCreateIndexes.map(index => createdTransactions[index]?.id).filter(isDefined);
        const postCreateTransactionInputs = prepared.postCreateIndexes.map(index => prepared.transactionInputs[index]).filter(isDefined);

        if (isNotEmptyArray(postCreateTransactionIds)) {
            await ruleEngineService.applyRulesToTransactions(postCreateTransactionIds, postCreateTransactionInputs);
        }

        return createdTransactions;
    }

    @Log(
        (record, transactionId) => `enter captureId="${record.captureId}" accountId=${record.accountId} transactionId=${transactionId}`,
        (_result, record, transactionId) =>
            `done captureId="${record.captureId}" accountId=${record.accountId} transactionId=${transactionId}`,
        (error, record, transactionId) =>
            `throw captureId="${record.captureId}" accountId=${record.accountId} transactionId=${transactionId} error=${getErrorMessage(error)}`
    )
    async applyRulesToExistingCaptureTransaction(record: WalletCaptureNativeRecordInterface, transactionId: number): Promise<void> {
        const input = this.mapCaptureToTransactionInput(record);
        const prepared = await ruleEngineService.prepareCreateInputsForRules([input]);
        const postCreateTransactionIds = prepared.postCreateIndexes.map(() => transactionId);
        const postCreateTransactionInputs = prepared.postCreateIndexes.map(index => prepared.transactionInputs[index]).filter(isDefined);

        if (isNotEmptyArray(postCreateTransactionIds)) {
            await ruleEngineService.applyRulesToTransactions(postCreateTransactionIds, postCreateTransactionInputs);
        }
    }

    private mapCaptureToTransactionInput(record: WalletCaptureNativeRecordInterface): TransactionCreateInputInterface {
        const trimmedMerchant = record.merchant.trim();
        const title = isNotEmptyString(trimmedMerchant) ? trimmedMerchant : i18n._(msg`Apple Pay purchase`);

        return {
            amount: record.amount,
            title,
            comment: '',
            type: TransactionTypeEnum.EXPENSE,
            exchangeRate: 1,
            operatedAt: new Date(record.capturedAt),
            externalId: record.captureId,
            updatedBy: null,
            externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
            fromAccountId: record.accountId,
            toAccountId: null,
            tagIds: [],
            entries: [
                {
                    accountId: record.accountId,
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: record.amount,
                    categoryId: null,
                    categorySource: CategorySourceEnum.USER,
                    mccCategoryId: null,
                    externalId: record.captureId,
                    exchangeRate: 1,
                    toIban: null
                }
            ]
        };
    }
}

export const walletCaptureTransactionService = new WalletCaptureTransactionService();
