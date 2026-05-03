import {
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';
import { transactionBatchCreateService } from '../../transaction/service/transaction-batch-create.service';
import { VoiceReviewRowInterface } from '../interface/voice-review-row.interface';

class VoiceReviewBatchCreateService {
    private static readonly DEFAULT_EXCHANGE_RATE = 1;

    @Log(
        (rows, accountId) => `enter count=${rows.length} accountId=${accountId}`,
        (result, rows, accountId) => `done count=${rows.length} accountId=${accountId} insertedIds=${result.map(row => row.id).join(',')}`,
        (error, rows, accountId) => `throw count=${rows.length} accountId=${accountId} error=${getErrorMessage(error)}`
    )
    async create(rows: VoiceReviewRowInterface[], accountId: number): Promise<TransactionEntityInterface[]> {
        const inputs = rows.map(row => this.mapRowToCreateInput(row, new Date(), accountId));

        return transactionAsync(db, async txDb => transactionBatchCreateService.create(inputs, txDb));
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
            exchangeRate: VoiceReviewBatchCreateService.DEFAULT_EXCHANGE_RATE,
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
}

export const voiceReviewBatchCreateService = new VoiceReviewBatchCreateService();
