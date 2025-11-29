import {
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryTypeEnum
} from '@budgie/contracts';

import {
    accountBalanceRepository,
    accountRepository,
    db,
    transactionEntryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

class TransactionService {
    async createInternal(input: TransactionCreateEntityInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const transaction = await transactionRepository.create(
                {
                    externalId: null,
                    type: input.type,
                    title: input.title,
                    externalSource: null,
                    comment: input.comment,
                    operatedAt: input.operatedAt,
                    toAccountId: input.toAccountId,
                    exchangeRate: input.exchangeRate,
                    fromAccountId: input.fromAccountId,
                    amount: convertToMicroUnits(input.amount),
                },
                tx
            );

            await Promise.all(
                input.entries.map(async entryInput => this.processEntry({ ...entryInput, transactionId: transaction.id }, tx))
            );

            return transaction;
        });
    }

    async processEntry(input: TransactionEntryCreateEntityInterface, tx): Promise<void> {
        const entry = await transactionEntryRepository.create(
            {
                type: input.type,
                accountId: input.accountId,
                categoryId: input.categoryId,
                instrumentId: input.instrumentId,
                transactionId: input.transactionId,
                amount: convertToMicroUnits(input.amount),
            },
            tx
        );

        const balance =
            entry.type === TransactionEntryTypeEnum.DEBIT
                ? await accountBalanceRepository.increaseByAccountId(entry.accountId, entry.amount, tx)
                : await accountBalanceRepository.decreaseByAccountId(entry.accountId, entry.amount, tx);

        await accountRepository.updateById(entry.accountId, { currentBalance: balance.amount }, tx);
    }
}

export const transactionService = new TransactionService();
