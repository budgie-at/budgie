import {
    Db,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { TransactionBatchCreateService } from '../../transaction/service/transaction-batch-create.service';
import { VoiceReviewRowInterface } from '../interface/voice-review-row.interface';

export class VoiceReviewBatchCreateService extends Context.Service<VoiceReviewBatchCreateService>()(
    '@budgie/app/VoiceReviewBatchCreateService',
    {
        make: Effect.gen(function* () {
            const transactionBatchCreateService = yield* TransactionBatchCreateService;

            const mapRowToCreateInput = (
                row: VoiceReviewRowInterface,
                operatedAt: Date,
                fallbackAccountId: number
            ): TransactionCreateInputInterface => {
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
                    updatedBy: null,
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
            };

            const findLargestRowIndex = (rows: readonly Pick<VoiceReviewRowInterface, 'amount'>[]): number => {
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
            };

            const getDestinationAccountId = (
                rows: readonly Pick<VoiceReviewRowInterface, 'accountId' | 'amount'>[],
                transactions: readonly Pick<TransactionEntityInterface, 'fromAccountId'>[],
                fallbackAccountId: number
            ): number => {
                if (!isNotEmptyArray(rows)) {
                    return fallbackAccountId;
                }
                const largestRowIndex = findLargestRowIndex(rows);
                const savedAccountId = transactions[largestRowIndex]?.fromAccountId;
                const rowAccountId = rows[largestRowIndex].accountId;

                if (isPositiveNumber(savedAccountId)) {
                    return savedAccountId;
                }
                if (isPositiveNumber(rowAccountId)) {
                    return rowAccountId;
                }

                return fallbackAccountId;
            };

            const create = Effect.fn('VoiceReviewBatchCreateService.create')(function* (
                rows: VoiceReviewRowInterface[],
                accountId: number
            ) {
                const inputs = rows.map(row => mapRowToCreateInput(row, new Date(), accountId));
                const transactions = yield* Db.transaction(transactionBatchCreateService.create(inputs));

                return {
                    transactions,
                    destinationAccountId: getDestinationAccountId(rows, transactions, accountId)
                };
            });

            return { create };
        })
    }
) {
    static readonly layer = Layer.effect(VoiceReviewBatchCreateService, VoiceReviewBatchCreateService.make).pipe(
        Layer.provide([TransactionBatchCreateService.layer])
    );
}
