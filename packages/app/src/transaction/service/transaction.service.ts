/* eslint-disable lingui/no-unlocalized-strings */
import {
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryTypeEnum
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    db,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { Transaction } from '../../@generic/type/transaction.type';

class TransactionService {
    async createInternal(input: TransactionCreateEntityInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const transaction = await transactionRepository.create(
                {
                    tagIds: [],
                    entries: [],
                    externalId: null,
                    externalSource: null,
                    type: input.type,
                    title: input.title,
                    comment: input.comment,
                    operatedAt: input.operatedAt,
                    toAccountId: input.toAccountId,
                    exchangeRate: input.exchangeRate,
                    fromAccountId: input.fromAccountId,
                    amount: convertToMicroUnits(input.amount)
                },
                tx
            );

            await this.upsertEntriesAndTags(transaction.id, input, tx);

            return transaction;
        });
    }

    async createInternalTransfer(input: TransactionCreateEntityInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const fromEntry = input.entries.find(({ accountId }) => accountId === input.fromAccountId);
            const toEntry = input.entries.find(({ accountId }) => accountId === input.toAccountId);

            if (!isDefined(fromEntry) || !isDefined(toEntry)) {
                throw new Error('Transfer must have exactly two entries');
            }

            const fromAmount = convertToMicroUnits(fromEntry.amount);
            const toAmount = convertToMicroUnits(toEntry.amount);

            const transaction = await transactionRepository.create(
                {
                    tagIds: [],
                    entries: [],
                    externalId: null,
                    externalSource: null,
                    type: input.type,
                    title: input.title,
                    comment: input.comment,
                    operatedAt: input.operatedAt,
                    toAccountId: input.toAccountId,
                    fromAccountId: input.fromAccountId,
                    amount: fromAmount,
                    exchangeRate: fromEntry.instrumentId === toEntry.instrumentId ? 1 : toAmount / fromAmount
                },
                tx
            );

            await transactionEntryRepository.create(
                {
                    ...fromEntry,
                    amount: fromAmount,
                    transactionId: transaction.id,
                    type: TransactionEntryTypeEnum.CREDIT,
                    instrumentId: fromEntry.instrumentId
                },
                tx
            );

            await transactionEntryRepository.create(
                {
                    ...toEntry,
                    amount: toAmount,
                    transactionId: transaction.id,
                    type: TransactionEntryTypeEnum.DEBIT,
                    instrumentId: toEntry.instrumentId
                },
                tx
            );

            if (isNotEmptyArray(input.tagIds)) {
                await transactionTagsRepository.create(
                    input.tagIds.map(tagId => ({ transactionId: transaction.id, tagId })),
                    tx
                );
            }

            return transaction;
        });
    }

    async updateById(id: number, input: TransactionCreateEntityInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const transaction = await transactionRepository.updateById(
                id,
                {
                    type: input.type,
                    title: input.title,
                    comment: input.comment,
                    operatedAt: input.operatedAt,
                    toAccountId: input.toAccountId,
                    exchangeRate: input.exchangeRate,
                    fromAccountId: input.fromAccountId,
                    amount: convertToMicroUnits(input.amount)
                },
                tx
            );

            await this.upsertEntriesAndTags(id, input, tx);

            return transaction;
        });
    }

    private async upsertEntriesAndTags(transactionId: number, input: TransactionCreateEntityInterface, tx: Transaction): Promise<void> {
        await transactionEntryRepository.deleteByTransactionId(transactionId, tx);

        await Promise.all(
            input.entries.map(async entry =>
                transactionEntryRepository.create(
                    {
                        ...entry,
                        amount: convertToMicroUnits(entry.amount),
                        transactionId
                    },
                    tx
                )
            )
        );

        await transactionTagsRepository.deleteByTransactionId(transactionId, tx);

        if (isNotEmptyArray(input.tagIds)) {
            await transactionTagsRepository.create(
                input.tagIds.map(tagId => ({ transactionId, tagId })),
                tx
            );
        }
    }
}

export const transactionService = new TransactionService();
