/* eslint-disable lingui/no-unlocalized-strings */
import {
    ExternalSourceEnum,
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryTypeEnum
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';

class TransactionService {
    async findByExternalSource(externalSource: ExternalSourceEnum): Promise<TransactionEntityInterface[]> {
        return transactionRepository.findByExternalSource(externalSource);
    }

    async createInternal(input: TransactionCreateEntityInterface): Promise<TransactionEntityInterface> {
        const [transaction] = await this.bulkCreate([input]);

        return transaction;
    }

    async bulkCreate(inputs: TransactionCreateEntityInterface[], batchSize = 500): Promise<TransactionEntityInterface[]> {
        return await processInputWithBatches(inputs, batchSize, this.processBatch.bind(this));
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
                await transactionTagsRepository.bulkCreate(
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

    private processBatch(batch: TransactionCreateEntityInterface[]): Promise<TransactionEntityInterface[]> {
        return db.transaction(async tx => {
            const preparedInputs = batch.map(input => ({
                ...input,
                amount: convertToMicroUnits(input.amount)
            }));

            const transactions = await transactionRepository.bulkCreate(preparedInputs, tx);

            // HINT: This will work if bulkCreate will preserve the order of the inputs.
            const batchEntries = transactions.flatMap((transaction, index) =>
                batch[index].entries.map(entry => ({
                    ...entry,
                    transactionId: transaction.id,
                    amount: convertToMicroUnits(entry.amount)
                }))
            );

            const batchTags = transactions.flatMap((transaction, index) =>
                batch[index].tagIds.map(tagId => ({ transactionId: transaction.id, tagId }))
            );

            await transactionEntryRepository.bulkCreate(batchEntries, tx);
            await transactionTagsRepository.bulkCreate(batchTags, tx);

            return transactions;
        });
    }

    private async upsertEntriesAndTags(transactionId: number, input: TransactionCreateEntityInterface, tx: Transaction): Promise<void> {
        await transactionEntryRepository.deleteByTransactionId(transactionId, tx);

        await transactionEntryRepository.bulkCreate(
            input.entries.map(entry => ({ ...entry, amount: convertToMicroUnits(entry.amount), transactionId }), tx)
        );

        await transactionTagsRepository.deleteByTransactionId(transactionId, tx);

        if (isNotEmptyArray(input.tagIds)) {
            await transactionTagsRepository.bulkCreate(
                input.tagIds.map(tagId => ({ transactionId, tagId })),
                tx
            );
        }
    }
}

export const transactionService = new TransactionService();
