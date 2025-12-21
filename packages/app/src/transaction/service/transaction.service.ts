/* eslint-disable lingui/no-unlocalized-strings */
import { TransactionCreateEntityInterface, TransactionEntityInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

class TransactionService {
    async createInternal(input: TransactionCreateEntityInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const transaction = await transactionRepository.create(
                {
                    ...input,
                    tagIds: [],
                    entries: [],
                    externalId: null,
                    externalSource: null,
                    amount: convertToMicroUnits(input.amount)
                },
                tx
            );

            await this.upsertEntriesAndTags(transaction.id, input, tx);

            return transaction;
        });
    }

    async bulkCreate(inputs: TransactionCreateEntityInterface[], batchSize = 100): Promise<TransactionEntityInterface[]> {
        const batches: TransactionCreateEntityInterface[][] = [];
        for (let i = 0; i < inputs.length; i += batchSize) {
            batches.push(inputs.slice(i, i + batchSize));
        }

        const batchResults = await Promise.all(
            batches.map(batch =>
                db.transaction(async tx => {
                    const preparedInputs = batch.map(input => ({
                        ...input,
                        tagIds: [],
                        entries: [],
                        externalId: null,
                        externalSource: null,
                        amount: convertToMicroUnits(input.amount)
                    }));

                    const transactions = await transactionRepository.bulkCreate(preparedInputs, tx);

                    const allEntries = transactions.flatMap((transaction, index) =>
                        batch[index].entries.map(entry => ({
                            ...entry,
                            transactionId: transaction.id,
                            amount: convertToMicroUnits(entry.amount)
                        }))
                    );

                    if (isNotEmptyArray(allEntries)) {
                        await transactionEntryRepository.bulkCreate(allEntries, tx);
                    }

                    const allTags = transactions.flatMap((transaction, index) =>
                        batch[index].tagIds.map(tagId => ({
                            transactionId: transaction.id,
                            tagId
                        }))
                    );

                    if (isNotEmptyArray(allTags)) {
                        await transactionTagsRepository.create(allTags, tx);
                    }

                    return transactions;
                })
            )
        );

        return batchResults.flat();
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
                    ...input,
                    externalId: null,
                    amount: fromAmount,
                    externalSource: null,
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
            const transaction = await transactionRepository.updateById(id, { ...input, amount: convertToMicroUnits(input.amount) }, tx);

            await this.upsertEntriesAndTags(id, input, tx);

            return transaction;
        });
    }

    private async upsertEntriesAndTags(transactionId: number, input: TransactionCreateEntityInterface, tx: Transaction): Promise<void> {
        await transactionEntryRepository.deleteByTransactionId(transactionId, tx);

        await transactionEntryRepository.bulkCreate(
            input.entries.map(entry => ({ ...entry, amount: convertToMicroUnits(entry.amount), transactionId }), tx)
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
