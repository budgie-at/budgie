import {
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';
import { transactionBatchCreateService } from '../../transaction/service/transaction-batch-create.service';
import { VoiceReviewCreateResultInterface } from '../interface/voice-review-create-result.interface';
import { VoiceReviewRowInterface } from '../interface/voice-review-row.interface';

class VoiceReviewBatchCreateService {
    @Log(
        (rows, accountId) => `enter count=${rows.length} accountId=${accountId}`,
        (result, rows, accountId) =>
            `done count=${rows.length} accountId=${accountId} destinationAccountId=${result.destinationAccountId} insertedIds=${result.transactions.map(row => row.id).join(',')}`,
        (error, rows, accountId) => `throw count=${rows.length} accountId=${accountId} error=${getErrorMessage(error)}`
    )
    async create(rows: VoiceReviewRowInterface[], accountId: number): Promise<VoiceReviewCreateResultInterface> {
        const inputs = rows.map(row => this.mapRowToCreateInput(row, new Date(), accountId));
        const transactions = await transactionAsync(db, async txDb => transactionBatchCreateService.create(inputs, txDb));

        return {
            transactions,
            destinationAccountId: this.getDestinationAccountId(rows, transactions, accountId)
        };
    }

    private mapRowToCreateInput(
        row: VoiceReviewRowInterface,
        operatedAt: Date,
        fallbackAccountId: number
    ): TransactionCreateInputInterface {
        const accountId = isDefined(row.accountId) ? row.accountId : fallbackAccountId;
        const categoryId = isPositiveNumber(row.categoryId) ? row.categoryId : 0;
        const title = isNotEmptyString(row.description) ? row.description : '';

        return {
            type: TransactionTypeEnum.EXPENSE,
            title,
            operatedAt,
            comment: '',
            externalId: null,
            externalSource: null,
            fromAccountId: accountId,
            toAccountId: null,
            exchangeRate: 1,
            consolidationParentTransactionId: null,
            consolidationType: null,
            needsEmbedding: false,
            amount: row.amount,
            tagIds: [],
            entries: [
                {
                    accountId,
                    categoryId,
                    amount: row.amount,
                    type: TransactionEntryTypeEnum.CREDIT,
                    mccCategoryId: null,
                    externalId: null
                }
            ]
        };
    }

    private getDestinationAccountId(
        rows: readonly Pick<VoiceReviewRowInterface, 'accountId' | 'amount'>[],
        transactions: readonly Pick<TransactionEntityInterface, 'fromAccountId'>[],
        fallbackAccountId: number
    ): number {
        if (!isNotEmptyArray(rows)) {
            return fallbackAccountId;
        }
        const largestRowIndex = this.findLargestRowIndex(rows);
        const savedAccountId = transactions[largestRowIndex]?.fromAccountId;
        const rowAccountId = rows[largestRowIndex].accountId;

        if (isPositiveNumber(savedAccountId)) {
            return savedAccountId;
        }
        if (isPositiveNumber(rowAccountId)) {
            return rowAccountId;
        }

        return fallbackAccountId;
    }

    private findLargestRowIndex(rows: readonly Pick<VoiceReviewRowInterface, 'amount'>[]): number {
        let largestIndex = 0;
        let largestAmount = rows[0]?.amount ?? 0;

        for (let index = 1; index < rows.length; index += 1) {
            const row = rows[index];
            if (isDefined(row) && row.amount > largestAmount) {
                largestIndex = index;
                largestAmount = row.amount;
            }
        }

        return largestIndex;
    }
}

export const voiceReviewBatchCreateService = new VoiceReviewBatchCreateService();
