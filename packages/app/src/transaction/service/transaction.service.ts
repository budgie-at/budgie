/* eslint-disable lingui/no-unlocalized-strings */
import {
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntityTable,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { accountService } from '../../account/service/account.service';
import { SystemCategoryIdEnum } from '../../category/enum/system-category-id.enum';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

class TransactionService {
    async findByExternalSource(externalSource: ExternalSourceEnum): Promise<Set<string>> {
        return new Set([...(await transactionRepository.findExternalIdsByExternalSource(externalSource))]);
    }

    async deleteById(id: number) {
        await db.transaction(async tx => {
            await transactionRepository.deleteById(id, tx);
            await transactionTagsRepository.deleteByTransactionId(id, tx);
            await transactionEntryRepository.deleteByTransactionId(id, tx);
            await accountBalanceIncrementalService.updateAllBalances(true, tx);
        });
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
                    { ...fromEntry, amount: fromAmountInMicroUnits, transactionId: transaction.id, type: TransactionEntryTypeEnum.CREDIT },
                    { ...toEntry, amount: toAmount, transactionId: transaction.id, type: TransactionEntryTypeEnum.DEBIT }
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

            await accountBalanceIncrementalService.updateAllBalances(true, tx);

            return transaction;
        });
    }

    async updateFromSync(externalId: string, input: TransactionCreateInputInterface): Promise<void> {
        await db.transaction(async tx => {
            const existingTransactions = await transactionRepository.findById(
                (
                    await db
                        .select({ id: TransactionEntityTable.id })
                        .from(TransactionEntityTable)
                        .where(eq(TransactionEntityTable.externalId, externalId))
                )[0]?.id ?? 0
            );

            if (!isDefined(existingTransactions)) {
                return;
            }

            if (isDefined(existingTransactions.deletedAt)) {
                return;
            }

            await transactionRepository.updateById(
                existingTransactions.id,
                {
                    title: input.title,
                    comment: input.comment,
                    operatedAt: input.operatedAt
                },
                tx
            );

            const [existingEntry] = existingTransactions.entries;
            const [syncEntry] = input.entries;

            if (isDefined(existingEntry) && isDefined(syncEntry)) {
                await transactionEntryRepository.updateById(
                    existingEntry.id,
                    {
                        amount: convertToMicroUnits(syncEntry.amount),
                        exchangeRate: syncEntry.exchangeRate,
                        toIban: syncEntry.toIban
                    },
                    tx
                );
            }
        });
    }

    async convertExpenseToTransfer(id: number, toAccountId: number): Promise<TransactionEntityInterface> {
        // eslint-disable-next-line max-statements
        return await db.transaction(async tx => {
            const transaction = await transactionRepository.getById(id);

            if (!isDefined(transaction)) {
                throw new Error('Transaction not found');
            }

            if (transaction.type !== TransactionTypeEnum.EXPENSE) {
                throw new Error('Only expense transactions can be converted');
            }

            if (!isDefined(transaction.fromAccountId)) {
                throw new Error('Transaction must have a source account');
            }

            const { entries } = transaction;

            if (entries.length !== 1) {
                throw new Error('Only single-entry expenses can be converted');
            }

            const [fromAccount, toAccount] = await Promise.all([
                accountService.findByIdOrFail(transaction.fromAccountId),
                accountService.findByIdOrFail(toAccountId)
            ]);

            const fromAmountInMicroUnits = entries[0].amount;

            const { amount: toAmount, exchangeRate } = await exchangeRatesService.convert(
                fromAccount.instrumentId,
                toAccount.instrumentId,
                fromAmountInMicroUnits
            );

            const isDebtTransaction = toAccount.type === AccountTypeEnum.DEBT || fromAccount.type === AccountTypeEnum.DEBT;

            const updated = await transactionRepository.updateById(
                id,
                {
                    type: isDebtTransaction ? TransactionTypeEnum.DEBT : TransactionTypeEnum.TRANSFER,
                    toAccountId,
                    exchangeRate
                },
                tx
            );

            await transactionEntryRepository.deleteByTransactionId(id, tx);

            await transactionEntryRepository.bulkCreate(
                [
                    {
                        transactionId: id,
                        accountId: transaction.fromAccountId,
                        type: TransactionEntryTypeEnum.CREDIT,
                        amount: fromAmountInMicroUnits,
                        categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
                        mccCategoryId: null,
                        externalId: null
                    },
                    {
                        transactionId: id,
                        accountId: toAccountId,
                        type: TransactionEntryTypeEnum.DEBIT,
                        amount: toAmount,
                        categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
                        mccCategoryId: null,
                        externalId: null
                    }
                ],
                tx
            );

            await accountBalanceIncrementalService.updateAllBalances(true, tx);

            return updated;
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
            input.entries.map(entry => ({ ...entry, amount: convertToMicroUnits(entry.amount), transactionId })),
            tx
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
