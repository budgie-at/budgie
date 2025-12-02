import {
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityInterface,
    TransactionEntryTypeEnum
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    accountBalanceRepository,
    accountRepository,
    db,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

import type { Transaction } from '../../@generic/type/transaction.type';

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

            await this.createEntries(
                input.entries.map(entry => ({ ...entry, amount: convertToMicroUnits(entry.amount), transactionId: transaction.id })),
                tx
            );

            if (isNotEmptyArray(input.tagIds)) {
                await Promise.all(
                    input.tagIds.map(async id => transactionTagsRepository.create({ transactionId: transaction.id, tagId: id }, tx))
                );
            }

            return transaction;
        });
    }

    private async createEntries(entries: TransactionEntryCreateEntityInterface[], tx: Transaction): Promise<void> {
        const created = await Promise.all(entries.map(entry => transactionEntryRepository.create(entry, tx)));

        await Promise.all(created.map(entry => this.applyEntry(entry, tx)));
    }

    private async applyEntry(input: TransactionEntryEntityInterface, tx: Transaction): Promise<void> {
        const entry = isDefined(input.id)
            ? { ...input, id: input.id }
            : await transactionEntryRepository.create(
                  {
                      type: input.type,
                      accountId: input.accountId,
                      categoryId: input.categoryId,
                      instrumentId: input.instrumentId,
                      transactionId: input.transactionId,
                      amount: convertToMicroUnits(input.amount)
                  },
                  tx
              );

        const isDebit = entry.type === TransactionEntryTypeEnum.DEBIT;
        const balance = isDebit
            ? await accountBalanceRepository.increaseByAccountId(entry.accountId, entry.amount, tx)
            : await accountBalanceRepository.decreaseByAccountId(entry.accountId, entry.amount, tx);

        await accountRepository.updateById(entry.accountId, { currentBalance: balance.amount }, tx);
    }
}

export const transactionService = new TransactionService();
