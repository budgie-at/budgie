/* eslint-disable lingui/no-unlocalized-strings */
import {
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    db,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { accountService } from '../../account/service/account.service';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

class TransactionService {
    async findByExternalSource(externalSource: ExternalSourceEnum): Promise<TransactionEntityInterface[]> {
        return transactionRepository.findByExternalSource(externalSource);
    }

    async findByAccountId(accountId: number): Promise<TransactionEntityInterface[]> {
        return transactionRepository.findByAccountId(accountId);
    }

    async getLatestTransactionTimeByAccountId(accountId: number): Promise<Date | null> {
        return transactionRepository.getTransactionTimeByAccountId(accountId, 'latest');
    }

    async getEarliestTransactionTimeByAccountId(accountId: number): Promise<Date | null> {
        return transactionRepository.getTransactionTimeByAccountId(accountId, 'earliest');
    }

    async createInternal(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        const [transaction] = await this.bulkCreate([input]);

        return transaction;
    }

    async bulkCreate(inputs: TransactionCreateInputInterface[], batchSize = 500): Promise<TransactionEntityInterface[]> {
        return await processInputWithBatches(inputs, batchSize, this.processBatch.bind(this));
    }

    async createInternalTransfer(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const { fromEntry, toEntry } = this.findPrimaryEntries(input.entries, input.fromAccountId, input.toAccountId);

            const [fromAccount, toAccount] = await Promise.all([
                accountService.findByIdOrFail(fromEntry.accountId),
                accountService.findByIdOrFail(toEntry.accountId)
            ]);

            const fromAmountInMicroUnits = convertToMicroUnits(fromEntry.amount);

            const { amount: toAmount, exchangeRate } = await exchangeRatesService.convert(
                fromAccount.instrumentId,
                toAccount.instrumentId,
                fromAmountInMicroUnits
            );

            const isDebtTransaction = toAccount.type === AccountTypeEnum.DEBT || fromAccount.type === AccountTypeEnum.DEBT;

            const transaction = await transactionRepository.create(
                {
                    ...input,
                    exchangeRate,
                    externalId: null,
                    externalSource: null,
                    type: isDebtTransaction ? TransactionTypeEnum.DEBT : input.type
                },
                tx
            );

            await transactionEntryRepository.bulkCreate(
                [
                    { ...fromEntry, amount: fromAmountInMicroUnits, transactionId: transaction.id, type: TransactionEntryTypeEnum.DEBIT },
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

    private findPrimaryEntries(entries: TransactionEntryCreateInputInterface[], fromAccountId: number | null, toAccountId: number | null) {
        const fromEntry = entries.find(({ accountId }) => accountId === fromAccountId);
        const toEntry = entries.find(({ accountId }) => accountId === toAccountId);

        if (!isDefined(fromEntry) || !isDefined(toEntry)) {
            throw new Error('Transfer must have exactly two entries');
        }

        return { fromEntry, toEntry };
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
