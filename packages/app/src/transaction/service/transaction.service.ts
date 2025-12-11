import { TransactionCreateEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

class TransactionService {
    async createInternal(input: TransactionCreateEntityInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const transaction = await transactionRepository.create(
                {
                    tagIds: [],
                    entries: [],
                    externalId: null,
                    type: input.type,
                    title: input.title,
                    externalSource: null,
                    comment: input.comment,
                    operatedAt: input.operatedAt,
                    toAccountId: input.toAccountId,
                    exchangeRate: input.exchangeRate,
                    fromAccountId: input.fromAccountId,
                    amount: convertToMicroUnits(input.amount)
                },
                tx
            );

            await Promise.all(
                input.entries.map(async entry =>
                    transactionEntryRepository.create(
                        { ...entry, amount: convertToMicroUnits(entry.amount), transactionId: transaction.id },
                        tx
                    )
                )
            );

            if (isNotEmptyArray(input.tagIds)) {
                await Promise.all(
                    input.tagIds.map(async id => transactionTagsRepository.create({ transactionId: transaction.id, tagId: id }, tx))
                );
            }

            return transaction;
        });
    }
}

export const transactionService = new TransactionService();
