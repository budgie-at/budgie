/* eslint-disable max-lines -- Transaction service contains related conversion methods */
import {
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { accountService } from '../../account/service/account.service';
import { SystemCategoryIdEnum } from '../../category/enum/system-category-id.enum';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';

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
        // eslint-disable-next-line max-statements -- Transfer creation with optional custom exchange rate
        return await db.transaction(async tx => {
            const { fromEntry, toEntry } = this.findPrimaryEntries(input.entries, input.fromAccountId, input.toAccountId);

            const [fromAccount, toAccount] = await Promise.all([
                accountService.findByIdOrFail(fromEntry.accountId),
                accountService.findByIdOrFail(toEntry.accountId)
            ]);

            const fromAmountInMicroUnits = convertToMicroUnits(fromEntry.amount);
            const hasCustomExchangeRate = isPositiveNumber(input.exchangeRate) && input.exchangeRate !== 1;

            const { amount: autoToAmount, exchangeRate: autoExchangeRate } = await exchangeRatesService.convert(
                fromAccount.instrumentId,
                toAccount.instrumentId,
                fromAmountInMicroUnits
            );

            const exchangeRate = hasCustomExchangeRate ? input.exchangeRate : autoExchangeRate;
            const toAmount = hasCustomExchangeRate ? fromAmountInMicroUnits / input.exchangeRate : autoToAmount;

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
                    {
                        transactionId: transaction.id,
                        accountId: fromEntry.accountId,
                        categoryId: fromEntry.categoryId,
                        mccCategoryId: fromEntry.mccCategoryId,
                        type: TransactionEntryTypeEnum.CREDIT,
                        amount: fromAmountInMicroUnits,
                        externalId: fromEntry.externalId ?? null
                    },
                    {
                        transactionId: transaction.id,
                        accountId: toEntry.accountId,
                        categoryId: toEntry.categoryId,
                        mccCategoryId: toEntry.mccCategoryId,
                        type: TransactionEntryTypeEnum.DEBIT,
                        amount: toAmount,
                        externalId: toEntry.externalId ?? null
                    },
                    ...this.buildAdditionalEntries(input.entries, fromEntry, toEntry, transaction.id)
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

    async update(input: TransactionCreateInputInterface): Promise<void> {
        await db.transaction(async tx => {
            for (const entry of input.entries) {
                if (isDefined(entry) && isDefined(entry.externalId)) {
                    const [updatedEntry] = await tx
                        .update(TransactionEntryEntityTable)
                        .set({
                            amount: convertToMicroUnits(entry.amount),
                            exchangeRate: entry.exchangeRate,
                            toIban: entry.toIban
                        })
                        .where(eq(TransactionEntryEntityTable.externalId, entry.externalId))
                        .returning({ transactionId: TransactionEntryEntityTable.transactionId });

                    if (isDefined(updatedEntry)) {
                        await transactionRepository.updateById(
                            updatedEntry.transactionId,
                            {
                                title: input.title,
                                comment: input.comment,
                                operatedAt: input.operatedAt
                            },
                            tx
                        );
                    }
                }
            }
        });
    }

    async convertToTransfer(params: ConvertToTransferParamsInterface): Promise<TransactionEntityInterface> {
        const { id, accountId, customExchangeRate, sourceType } = params;

        // eslint-disable-next-line max-statements -- Transfer conversion with validation, exchange rate calculation, and entry creation
        return await db.transaction(async tx => {
            const transaction = await transactionRepository.getById(id);

            if (!isDefined(transaction)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Transaction not found');
            }

            if (transaction.type !== sourceType) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Transaction type does not match expected source type');
            }

            const isExpense = sourceType === TransactionTypeEnum.EXPENSE;
            const existingAccountId = isExpense ? transaction.fromAccountId : transaction.toAccountId;

            if (!isDefined(existingAccountId)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Transaction must have an associated account');
            }

            const { entries } = transaction;

            if (entries.length !== 1) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Only single-entry transactions can be converted');
            }

            const fromAccountId = isExpense ? existingAccountId : accountId;
            const toAccountId = isExpense ? accountId : existingAccountId;

            const [fromAccount, toAccount] = await Promise.all([
                accountService.findByIdOrFail(fromAccountId),
                accountService.findByIdOrFail(toAccountId)
            ]);

            const knownAmountInMicroUnits = entries[0].amount;

            const sourceInstrumentId = isExpense ? fromAccount.instrumentId : toAccount.instrumentId;
            const targetInstrumentId = isExpense ? toAccount.instrumentId : fromAccount.instrumentId;

            const { amount: autoConvertedAmount, exchangeRate: autoExchangeRate } = await exchangeRatesService.convert(
                sourceInstrumentId,
                targetInstrumentId,
                knownAmountInMicroUnits
            );

            const hasCustomRate = isPositiveNumber(customExchangeRate) && customExchangeRate !== 1;
            const exchangeRate = hasCustomRate ? customExchangeRate : autoExchangeRate;
            const convertedAmount = hasCustomRate ? knownAmountInMicroUnits / customExchangeRate : autoConvertedAmount;

            const creditAmount = isExpense ? knownAmountInMicroUnits : convertedAmount;
            const debitAmount = isExpense ? convertedAmount : knownAmountInMicroUnits;

            const isDebtTransaction = toAccount.type === AccountTypeEnum.DEBT || fromAccount.type === AccountTypeEnum.DEBT;

            const updatedAccountField = isExpense ? { toAccountId: accountId } : { fromAccountId: accountId };

            const updated = await transactionRepository.updateById(
                id,
                {
                    type: isDebtTransaction ? TransactionTypeEnum.DEBT : TransactionTypeEnum.TRANSFER,
                    ...updatedAccountField,
                    exchangeRate
                },
                tx
            );

            await transactionEntryRepository.deleteByTransactionId(id, tx);

            await transactionEntryRepository.bulkCreate(
                [
                    {
                        transactionId: id,
                        accountId: fromAccountId,
                        type: TransactionEntryTypeEnum.CREDIT,
                        amount: creditAmount,
                        categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
                        mccCategoryId: null,
                        externalId: null
                    },
                    {
                        transactionId: id,
                        accountId: toAccountId,
                        type: TransactionEntryTypeEnum.DEBIT,
                        amount: debitAmount,
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

    /* jscpd:ignore-start */
    private buildAdditionalEntries(
        entries: TransactionEntryCreateInputInterface[],
        fromEntry: TransactionEntryCreateInputInterface,
        toEntry: TransactionEntryCreateInputInterface,
        transactionId: number
    ): TransactionEntryCreateEntityInterface[] {
        return entries
            .filter(entry => entry !== fromEntry && entry !== toEntry)
            .map(entry => ({
                transactionId,
                accountId: entry.accountId,
                categoryId: entry.categoryId,
                mccCategoryId: entry.mccCategoryId,
                type: entry.type,
                amount: convertToMicroUnits(entry.amount),
                externalId: entry.externalId ?? null
            }));
    }
    /* jscpd:ignore-end */

    private findPrimaryEntries(entries: TransactionEntryCreateInputInterface[], fromAccountId: number | null, toAccountId: number | null) {
        const fromEntry = entries.find(({ accountId }) => accountId === fromAccountId);
        const toEntry = entries.find(({ accountId }) => accountId === toAccountId);

        if (!isDefined(fromEntry) || !isDefined(toEntry)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
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
                    transactionId: transaction.id,
                    accountId: entry.accountId,
                    categoryId: entry.categoryId,
                    mccCategoryId: entry.mccCategoryId,
                    type: entry.type,
                    amount: convertToMicroUnits(entry.amount),
                    externalId: entry.externalId ?? null
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
            input.entries.map(entry => ({
                transactionId,
                accountId: entry.accountId,
                categoryId: entry.categoryId,
                mccCategoryId: entry.mccCategoryId,
                type: entry.type,
                amount: convertToMicroUnits(entry.amount),
                externalId: entry.externalId ?? null
            })),
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
