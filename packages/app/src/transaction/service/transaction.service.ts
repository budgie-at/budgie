/* eslint-disable max-lines -- Transaction service contains related conversion methods */
import {
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    transactionAsync
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { accountService } from '../../account/service/account.service';
import { SystemCategoryIdEnum } from '../../category/enum/system-category-id.enum';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';

import type { DB } from '@budgie/contracts';

class TransactionService {
    async findByExternalSource(externalSource: ExternalSourceEnum): Promise<Set<string>> {
        return new Set([...(await transactionRepository.findExternalIdsByExternalSource(externalSource))]);
    }

    async findIdMapByExternalSource(externalSource: ExternalSourceEnum): Promise<Map<string, number>> {
        return transactionRepository.findIdMapByExternalSource(externalSource);
    }

    async deleteById(id: number) {
        await transactionAsync(db, async tx => {
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

    async bulkCreate(inputs: TransactionCreateInputInterface[], tx?: DB, batchSize = 500): Promise<TransactionEntityInterface[]> {
        const batchProcessor = isDefined(tx)
            ? (batch: TransactionCreateInputInterface[]) => this.processBatchInner(batch, tx)
            : this.processBatch.bind(this);

        const transactions = await processInputWithBatches(inputs, batchSize, batchProcessor);

        if (isNotEmptyArray(transactions)) {
            await accountBalanceIncrementalService.updateAllBalances(true, tx);
        }

        return transactions;
    }

    async bulkUpsertImported(
        inputs: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>,
        tx?: DB
    ): Promise<TransactionEntityInterface[]> {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        const processor = isDefined(tx)
            ? (batch: TransactionCreateInputInterface[]) => this.processImportedBatchInner(batch, existingTransactionIdMap, tx)
            : (batch: TransactionCreateInputInterface[]) =>
                  transactionAsync(db, async innerTx => this.processImportedBatchInner(batch, existingTransactionIdMap, innerTx));

        const transactions = await processInputWithBatches(inputs, 500, processor);

        if (isNotEmptyArray(transactions)) {
            await accountBalanceIncrementalService.updateAllBalances(true, tx);
        }

        return transactions;
    }

    async createInternalTransfer(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        // eslint-disable-next-line max-statements -- Transfer creation with optional custom exchange rate
        return await transactionAsync(db, async tx => {
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

            await accountBalanceIncrementalService.updateAllBalances(true, tx);

            return transaction;
        });
    }

    async updateById(id: number, input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        return await transactionAsync(db, async tx => {
            const transaction = await transactionRepository.updateById(id, input, tx);

            await this.upsertEntriesAndTags(id, input, tx);

            await accountBalanceIncrementalService.updateAllBalances(true, tx);

            return transaction;
        });
    }

    /* jscpd:ignore-start */
    async convertExpenseToTransfer(params: ConvertToTransferParamsInterface): Promise<TransactionEntityInterface> {
        const { id, accountId: toAccountId, customExchangeRate } = params;

        // eslint-disable-next-line max-statements
        return await transactionAsync(db, async tx => {
            const transaction = await transactionRepository.getById(id);

            if (!isDefined(transaction)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Transaction not found');
            }

            if (transaction.type !== TransactionTypeEnum.EXPENSE) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Only expense transactions can be converted');
            }

            if (!isDefined(transaction.fromAccountId)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Transaction must have a source account');
            }

            const { entries } = transaction;

            if (entries.length !== 1) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Only single-entry expenses can be converted');
            }

            const [fromAccount, toAccount] = await Promise.all([
                accountService.findByIdOrFail(transaction.fromAccountId),
                accountService.findByIdOrFail(toAccountId)
            ]);

            const fromAmountInMicroUnits = entries[0].amount;

            const { amount: autoToAmount, exchangeRate: autoExchangeRate } = await exchangeRatesService.convert(
                fromAccount.instrumentId,
                toAccount.instrumentId,
                fromAmountInMicroUnits
            );

            const hasCustomRate = isPositiveNumber(customExchangeRate) && customExchangeRate !== 1;
            const exchangeRate = hasCustomRate ? customExchangeRate : autoExchangeRate;
            const toAmount = hasCustomRate ? fromAmountInMicroUnits / customExchangeRate : autoToAmount;

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
    /* jscpd:ignore-end */

    /* jscpd:ignore-start */
    async convertIncomeToTransfer(params: ConvertToTransferParamsInterface): Promise<TransactionEntityInterface> {
        const { id, accountId: fromAccountId, customExchangeRate } = params;

        // eslint-disable-next-line max-statements
        return await transactionAsync(db, async tx => {
            const transaction = await transactionRepository.getById(id);

            if (!isDefined(transaction)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Transaction not found');
            }

            if (transaction.type !== TransactionTypeEnum.INCOME) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Only income transactions can be converted');
            }

            if (!isDefined(transaction.toAccountId)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Transaction must have a destination account');
            }

            const { entries } = transaction;

            if (entries.length !== 1) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Only single-entry incomes can be converted');
            }

            const [fromAccount, toAccount] = await Promise.all([
                accountService.findByIdOrFail(fromAccountId),
                accountService.findByIdOrFail(transaction.toAccountId)
            ]);

            const toAmountInMicroUnits = entries[0].amount;

            const { amount: autoFromAmount, exchangeRate: autoExchangeRate } = await exchangeRatesService.convert(
                toAccount.instrumentId,
                fromAccount.instrumentId,
                toAmountInMicroUnits
            );

            const hasCustomRate = isPositiveNumber(customExchangeRate) && customExchangeRate !== 1;
            const exchangeRate = hasCustomRate ? customExchangeRate : autoExchangeRate;
            const fromAmount = hasCustomRate ? toAmountInMicroUnits / customExchangeRate : autoFromAmount;

            const isDebtTransaction = toAccount.type === AccountTypeEnum.DEBT || fromAccount.type === AccountTypeEnum.DEBT;

            const updated = await transactionRepository.updateById(
                id,
                {
                    type: isDebtTransaction ? TransactionTypeEnum.DEBT : TransactionTypeEnum.TRANSFER,
                    fromAccountId,
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
                        amount: fromAmount,
                        categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
                        mccCategoryId: null,
                        externalId: null
                    },
                    {
                        transactionId: id,
                        accountId: transaction.toAccountId,
                        type: TransactionEntryTypeEnum.DEBIT,
                        amount: toAmountInMicroUnits,
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
    /* jscpd:ignore-end */

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
        return transactionAsync(db, async tx => this.processBatchInner(batch, tx));
    }

    private async processImportedBatchInner(
        batch: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>,
        tx: DB
    ): Promise<TransactionEntityInterface[]> {
        const newInputs = batch.filter(input => !this.isExistingImportedTransaction(input, existingTransactionIdMap));
        const importedUpdateParams = this.buildImportedUpdateParams(batch, existingTransactionIdMap);
        const createdTransactions = await this.processBatchInner(newInputs, tx);
        const updatedTransactions = await Promise.all(
            importedUpdateParams.map(params => this.updateImportedTransaction(params.transactionId, params.input, tx))
        );

        return [...updatedTransactions, ...createdTransactions];
    }

    private async processBatchInner(batch: TransactionCreateInputInterface[], tx: DB): Promise<TransactionEntityInterface[]> {
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

        await Promise.all([transactionEntryRepository.bulkCreate(batchEntries, tx), transactionTagsRepository.bulkCreate(batchTags, tx)]);

        return transactions;
    }

    private async upsertEntriesAndTags(transactionId: number, input: TransactionCreateInputInterface, tx: DB): Promise<void> {
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

    private isExistingImportedTransaction(input: TransactionCreateInputInterface, existingTransactionIdMap: Map<string, number>): boolean {
        return isDefined(input.externalId) && existingTransactionIdMap.has(input.externalId);
    }

    private buildImportedUpdateParams(
        batch: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>
    ): Array<{ transactionId: number; input: TransactionCreateInputInterface }> {
        return batch.map(input => this.buildImportedUpdateParam(input, existingTransactionIdMap)).filter(isDefined);
    }

    private buildImportedUpdateParam(
        input: TransactionCreateInputInterface,
        existingTransactionIdMap: Map<string, number>
    ): { transactionId: number; input: TransactionCreateInputInterface } | null {
        const { externalId } = input;

        if (!isDefined(externalId)) {
            return null;
        }

        const transactionId = existingTransactionIdMap.get(externalId);

        if (!isDefined(transactionId)) {
            return null;
        }

        return { transactionId, input };
    }

    private async updateImportedTransaction(
        transactionId: number,
        input: TransactionCreateInputInterface,
        tx: DB
    ): Promise<TransactionEntityInterface> {
        const updatedTransaction = await transactionRepository.updateById(
            transactionId,
            {
                title: input.title,
                comment: input.comment,
                type: input.type,
                operatedAt: input.operatedAt,
                exchangeRate: input.exchangeRate,
                externalId: input.externalId,
                externalSource: input.externalSource,
                fromAccountId: input.fromAccountId,
                toAccountId: input.toAccountId
            },
            tx
        );

        await this.upsertEntriesAndTags(transactionId, input, tx);

        return updatedTransaction;
    }
}

export const transactionService = new TransactionService();
