import { TransactionCreateInputInterface, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { VoiceReviewRowInterface } from '../interface/voice-review-row.interface';

const DEFAULT_EXCHANGE_RATE = 1;

export const mapReviewRowsToCreateInputs = (
    rows: VoiceReviewRowInterface[],
    operatedAt: Date,
    fallbackAccountId: number,
    fallbackCategoryId: number
): TransactionCreateInputInterface[] =>
    rows.map(row => {
        const accountId = isDefined(row.accountId) ? row.accountId : fallbackAccountId;
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
            exchangeRate: DEFAULT_EXCHANGE_RATE,
            consolidationParentTransactionId: null,
            consolidationType: null,
            needsEmbedding: false,
            amount: row.amountMicroUnits,
            tagIds: [],
            entries: [
                {
                    accountId,
                    categoryId: fallbackCategoryId,
                    amount: row.amountMicroUnits,
                    type: TransactionEntryTypeEnum.CREDIT,
                    mccCategoryId: null,
                    externalId: null
                }
            ]
        };
    });
