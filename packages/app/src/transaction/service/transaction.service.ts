import {
    IncomeTransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionTypeEnum
} from '@budgie/contracts';

import { db, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';

class TransactionService {
    async createIncome(input: IncomeTransactionCreateEntityInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const transaction = await transactionRepository.create(
                {
                    externalId: null,
                    title: input.title,
                    fromAccountId: null,
                    externalSource: null,
                    comment: input.comment,
                    operatedAt: input.operatedAt,
                    toAccountId: input.toAccountId,
                    exchangeRate: input.exchangeRate,
                    type: TransactionTypeEnum.INCOME,
                },
                tx
            );

            await Promise.all(
                input.entries.map(async entry =>
                    transactionEntryRepository.create(
                        {
                            type: entry.type,
                            amount: entry.amount,
                            accountId: entry.accountId,
                            categoryId: entry.categoryId,
                            transactionId: transaction.id,
                            instrumentId: entry.instrumentId,
                            parentAccountId: entry.accountId,
                            parentCategoryId: entry.categoryId
                        },
                        tx
                    )
                )
            );

            return transaction;
        });
    }
}

export const transactionService = new TransactionService();
