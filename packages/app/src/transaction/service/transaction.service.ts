/* eslint-disable lingui/no-unlocalized-strings */
import {
    ExternalSourceEnum,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryTypeEnum
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    db,
    exchangeRateRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { accountService } from '../../account/service/account.service';

class TransactionService {
    async findByExternalSource(externalSource: ExternalSourceEnum): Promise<TransactionEntityInterface[]> {
        return transactionRepository.findByExternalSource(externalSource);
    }

    async findByAccountId(accountId: number): Promise<TransactionEntityInterface[]> {
        return transactionRepository.findByAccountId(accountId);
    }

    async getEarliestTransactionTimeByAccountId(accountId: number): Promise<Date | null> {
        return transactionRepository.getEarliestTransactionTimeByAccountId(accountId);
    }

    async createInternal(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        const [transaction] = await this.bulkCreate([input]);

        return transaction;
    }

    async bulkCreate(inputs: TransactionCreateInputInterface[], batchSize = 500): Promise<TransactionEntityInterface[]> {
        return await processInputWithBatches(inputs, batchSize, this.processBatch.bind(this));
    }

    async createInternalTransfer(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        // eslint-disable-next-line max-statements
        return await db.transaction(async tx => {
            const fromEntry = input.entries.find(({ accountId }) => accountId === input.fromAccountId);
            const toEntry = input.entries.find(({ accountId }) => accountId === input.toAccountId);

            if (!isDefined(fromEntry) || !isDefined(toEntry)) {
                throw new Error('Transfer must have exactly two entries');
            }

            const [fromAccount, toAccount] = await Promise.all([
                accountService.findByIdOrFail(fromEntry.accountId),
                accountService.findByIdOrFail(toEntry.accountId)
            ]);

            const rate = await exchangeRateRepository.findByBaseAndQuoteIds(toAccount.instrumentId, fromAccount.instrumentId);
            const exchangeRate = rate?.rate ?? convertToMicroUnits(1);

            const fromAmount = convertToMicroUnits(fromEntry.amount);
            const toAmount = convertToMicroUnits(fromAmount / exchangeRate);

            const transaction = await transactionRepository.create(
                {
                    ...input,
                    exchangeRate,
                    externalId: null,
                    externalSource: null
                },
                tx
            );

            await transactionEntryRepository.bulkCreate(
                [
                    { ...fromEntry, amount: fromAmount, transactionId: transaction.id, type: TransactionEntryTypeEnum.DEBIT },
                    { ...toEntry, amount: toAmount, transactionId: transaction.id, type: TransactionEntryTypeEnum.CREDIT }
                ],
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

    async updateById(id: number, input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const transaction = await transactionRepository.updateById(id, input, tx);

            await this.upsertEntriesAndTags(id, input, tx);

            return transaction;
        });
    }

    private processBatch(batch: TransactionCreateInputInterface[]): Promise<TransactionEntityInterface[]> {
        return db.transaction(async tx => {
            const transactions = await transactionRepository.bulkCreate(batch, tx);

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

    private async upsertEntriesAndTags(transactionId: number, input: TransactionCreateInputInterface, tx: Transaction): Promise<void> {
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
