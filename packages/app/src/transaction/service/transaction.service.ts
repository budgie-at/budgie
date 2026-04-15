/* eslint-disable max-lines -- Transaction service contains related conversion methods */
import {
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryEntityInterface,
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

interface TransferConversionParamsInterface {
    amount: number;
    customExchangeRate: number | undefined;
    fromAccountId: number | null;
    hasCustomRate: boolean;
    toAccountId: number | null;
}

interface TransferConversionResultInterface {
    creditAccountId: number;
    creditAmount: number;
    debitAccountId: number;
    debitAmount: number;
    exchangeRate: number;
    fromAccountId: number;
    toAccountId: number;
    transactionType: TransactionTypeEnum;
}

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

    async updateAllBalances(tx?: DB): Promise<void> {
        await accountBalanceIncrementalService.updateAllBalances(true, tx);
    }

    async createInternal(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        return transactionAsync(db, async tx => {
            const [transaction] = await this.bulkCreate([input], tx);

            return transaction;
        });
    }

    async bulkCreate(inputs: TransactionCreateInputInterface[], tx?: DB, batchSize = 500): Promise<TransactionEntityInterface[]> {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        if (!isDefined(tx)) {
            return transactionAsync(db, async innerTx => this.bulkCreate(inputs, innerTx, batchSize));
        }

        const transactions = await processInputWithBatches(inputs, batchSize, batch => this.processBatchInner(batch, tx));

        if (isNotEmptyArray(transactions)) {
            await accountBalanceIncrementalService.updateAllBalances(true, tx);
        }

        return transactions;
    }

    async bulkUpsertImported(
        inputs: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>,
        tx?: DB,
        shouldUpdateBalances = true
    ): Promise<TransactionEntityInterface[]> {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        if (!isDefined(tx)) {
            return transactionAsync(db, async innerTx =>
                this.bulkUpsertImported(inputs, existingTransactionIdMap, innerTx, shouldUpdateBalances)
            );
        }

        const transactions = await processInputWithBatches(inputs, 500, batch =>
            this.processImportedBatchInner(batch, existingTransactionIdMap, tx)
        );

        if (shouldUpdateBalances && isNotEmptyArray(transactions)) {
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
                        externalId: fromEntry.externalId ?? null,
                        exchangeRate: fromEntry.exchangeRate ?? 1,
                        toIban: fromEntry.toIban ?? null
                    },
                    {
                        transactionId: transaction.id,
                        accountId: toEntry.accountId,
                        categoryId: toEntry.categoryId,
                        mccCategoryId: toEntry.mccCategoryId,
                        type: TransactionEntryTypeEnum.DEBIT,
                        amount: toAmount,
                        externalId: toEntry.externalId ?? null,
                        exchangeRate: toEntry.exchangeRate ?? 1,
                        toIban: toEntry.toIban ?? null
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

    async convertExpenseToTransfer(params: ConvertToTransferParamsInterface): Promise<TransactionEntityInterface> {
        return this.convertToTransfer(params, 'expense');
    }

    async convertIncomeToTransfer(params: ConvertToTransferParamsInterface): Promise<TransactionEntityInterface> {
        return this.convertToTransfer(params, 'income');
    }

    private buildAdditionalEntries(
        entries: TransactionEntryCreateInputInterface[],
        fromEntry: TransactionEntryCreateInputInterface,
        toEntry: TransactionEntryCreateInputInterface,
        transactionId: number
    ): TransactionEntryCreateEntityInterface[] {
        return entries
            .filter(entry => entry !== fromEntry && entry !== toEntry)
            .map(entry => this.mapEntryInputToCreateEntity(entry, transactionId));
    }

    private mapEntryInputToCreateEntity(
        entry: TransactionEntryCreateInputInterface,
        transactionId: number
    ): TransactionEntryCreateEntityInterface {
        return {
            transactionId,
            accountId: entry.accountId,
            categoryId: entry.categoryId,
            mccCategoryId: entry.mccCategoryId,
            type: entry.type,
            amount: convertToMicroUnits(entry.amount),
            externalId: entry.externalId ?? null,
            exchangeRate: entry.exchangeRate ?? 1,
            toIban: entry.toIban ?? null
        };
    }

    private findPrimaryEntries(entries: TransactionEntryCreateInputInterface[], fromAccountId: number | null, toAccountId: number | null) {
        const fromEntry = entries.find(({ accountId }) => accountId === fromAccountId);
        const toEntry = entries.find(({ accountId }) => accountId === toAccountId);

        if (!isDefined(fromEntry) || !isDefined(toEntry)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
            throw new Error('Transfer must have exactly two entries');
        }

        return { fromEntry, toEntry };
    }

    private async convertToTransfer(
        params: ConvertToTransferParamsInterface,
        direction: 'expense' | 'income'
    ): Promise<TransactionEntityInterface> {
        return transactionAsync(db, async tx => {
            const conversion = await this.buildTransferConversion(direction, params);
            const updated = await transactionRepository.updateById(
                params.id,
                {
                    type: conversion.transactionType,
                    fromAccountId: conversion.fromAccountId,
                    toAccountId: conversion.toAccountId,
                    exchangeRate: conversion.exchangeRate
                },
                tx
            );

            await transactionEntryRepository.deleteByTransactionId(params.id, tx);
            await transactionEntryRepository.bulkCreate(
                [
                    this.buildTransferEntryCreateEntity(
                        params.id,
                        conversion.creditAccountId,
                        TransactionEntryTypeEnum.CREDIT,
                        conversion.creditAmount
                    ),
                    this.buildTransferEntryCreateEntity(
                        params.id,
                        conversion.debitAccountId,
                        TransactionEntryTypeEnum.DEBIT,
                        conversion.debitAmount
                    )
                ],
                tx
            );

            await accountBalanceIncrementalService.updateAllBalances(true, tx);

            return updated;
        });
    }

    private async buildTransferConversion(
        direction: 'expense' | 'income',
        params: ConvertToTransferParamsInterface
    ): Promise<TransferConversionResultInterface> {
        const transaction = await this.getTransferConversionTransaction(params.id, direction);
        const [transactionEntry] = transaction.entries;
        const { amount } = transactionEntry;
        const hasCustomRate = isPositiveNumber(params.customExchangeRate) && params.customExchangeRate !== 1;

        if (direction === 'expense') {
            return this.buildExpenseTransferConversion({
                amount,
                customExchangeRate: params.customExchangeRate,
                fromAccountId: transaction.fromAccountId,
                hasCustomRate,
                toAccountId: params.accountId
            });
        }

        return this.buildIncomeTransferConversion({
            amount,
            customExchangeRate: params.customExchangeRate,
            fromAccountId: params.accountId,
            hasCustomRate,
            toAccountId: transaction.toAccountId
        });
    }

    private async buildExpenseTransferConversion(params: TransferConversionParamsInterface): Promise<TransferConversionResultInterface> {
        const { amount, customExchangeRate, hasCustomRate, toAccountId } = params;
        const fromAccountId = this.requireTransferAccountId(params.fromAccountId, 'source');

        const [fromAccount, toAccount] = await Promise.all([
            accountService.findByIdOrFail(fromAccountId),
            accountService.findByIdOrFail(toAccountId)
        ]);
        const { amount: autoToAmount, exchangeRate: autoExchangeRate } = await exchangeRatesService.convert(
            fromAccount.instrumentId,
            toAccount.instrumentId,
            amount
        );
        const exchangeRate = hasCustomRate && isDefined(customExchangeRate) ? customExchangeRate : autoExchangeRate;
        const toAmount = hasCustomRate && isDefined(customExchangeRate) ? amount / customExchangeRate : autoToAmount;

        return this.buildTransferConversionResult({
            creditAccountId: fromAccountId,
            creditAmount: amount,
            debitAccountId: toAccountId,
            debitAmount: toAmount,
            exchangeRate,
            fromAccountId,
            toAccountId,
            transactionType: this.resolveTransferTransactionType(fromAccount.type, toAccount.type)
        });
    }

    private async buildIncomeTransferConversion(params: TransferConversionParamsInterface): Promise<TransferConversionResultInterface> {
        const { amount, customExchangeRate, fromAccountId, hasCustomRate } = params;
        const toAccountId = this.requireTransferAccountId(params.toAccountId, 'destination');

        const [fromAccount, toAccount] = await Promise.all([
            accountService.findByIdOrFail(fromAccountId),
            accountService.findByIdOrFail(toAccountId)
        ]);
        const { amount: autoFromAmount, exchangeRate: autoExchangeRate } = await exchangeRatesService.convert(
            toAccount.instrumentId,
            fromAccount.instrumentId,
            amount
        );
        const exchangeRate = hasCustomRate && isDefined(customExchangeRate) ? customExchangeRate : autoExchangeRate;
        const fromAmount = hasCustomRate && isDefined(customExchangeRate) ? amount / customExchangeRate : autoFromAmount;

        return this.buildTransferConversionResult({
            creditAccountId: fromAccountId,
            creditAmount: fromAmount,
            debitAccountId: toAccountId,
            debitAmount: amount,
            exchangeRate,
            fromAccountId,
            toAccountId,
            transactionType: this.resolveTransferTransactionType(fromAccount.type, toAccount.type)
        });
    }

    private async getTransferConversionTransaction(id: number, direction: 'expense' | 'income') {
        const transaction = await transactionRepository.getById(id);

        if (!isDefined(transaction)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
            throw new Error('Transaction not found');
        }

        if (transaction.type !== (direction === 'expense' ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME)) {
            if (direction === 'expense') {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Only expense transactions can be converted');
            }

            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
            throw new Error('Only income transactions can be converted');
        }

        if (transaction.entries.length !== 1) {
            if (direction === 'expense') {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                throw new Error('Only single-entry expenses can be converted');
            }

            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
            throw new Error('Only single-entry incomes can be converted');
        }

        return transaction;
    }

    private buildTransferEntryCreateEntity(
        transactionId: number,
        accountId: number,
        type: TransactionEntryTypeEnum,
        amount: number
    ): TransactionEntryCreateEntityInterface {
        return {
            transactionId,
            accountId,
            type,
            amount,
            categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER,
            mccCategoryId: null,
            externalId: null,
            exchangeRate: 1,
            toIban: null
        };
    }

    private buildTransferConversionResult(params: TransferConversionResultInterface) {
        return params;
    }

    private resolveTransferTransactionType(fromAccountType: AccountTypeEnum, toAccountType: AccountTypeEnum): TransactionTypeEnum {
        return toAccountType === AccountTypeEnum.DEBT || fromAccountType === AccountTypeEnum.DEBT
            ? TransactionTypeEnum.DEBT
            : TransactionTypeEnum.TRANSFER;
    }

    private requireTransferAccountId(accountId: number | null, kind: 'source' | 'destination'): number {
        if (isDefined(accountId)) {
            return accountId;
        }

        if (kind === 'source') {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
            throw new Error('Transaction must have a source account');
        }

        // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
        throw new Error('Transaction must have a destination account');
    }

    private async processImportedBatchInner(
        batch: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>,
        tx: DB
    ): Promise<TransactionEntityInterface[]> {
        const partition = this.partitionImportedBatch(batch, existingTransactionIdMap);
        const { newInputs, resultsOrder, updateParams } = partition;
        const createdTransactions = await this.processBatchInner(newInputs, tx);
        const updatedTransactions = await Promise.all(
            updateParams.map(params => this.updateImportedTransaction(params.transactionId, params.input, tx))
        );

        return resultsOrder.map(result =>
            result.kind === 'create' ? createdTransactions[result.index] : updatedTransactions[result.index]
        );
    }

    private async processBatchInner(batch: TransactionCreateInputInterface[], tx: DB): Promise<TransactionEntityInterface[]> {
        const transactions = await transactionRepository.bulkCreate(batch, tx);

        // HINT: This will work if bulkCreate will preserve the order of the inputs.
        const batchEntries = transactions.flatMap((transaction, index) =>
            batch[index].entries.map(entry => this.mapEntryInputToCreateEntity(entry, transaction.id))
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
            input.entries.map(entry => this.mapEntryInputToCreateEntity(entry, transactionId)),
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

    private partitionImportedBatch(
        batch: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>
    ): {
        newInputs: TransactionCreateInputInterface[];
        updateParams: Array<{ transactionId: number; input: TransactionCreateInputInterface }>;
        resultsOrder: Array<{ kind: 'create' | 'update'; index: number }>;
    } {
        const newInputs: TransactionCreateInputInterface[] = [];
        const updateParams: Array<{ transactionId: number; input: TransactionCreateInputInterface }> = [];
        const resultsOrder: Array<{ kind: 'create' | 'update'; index: number }> = [];

        for (const input of batch) {
            const importedUpdateParam = this.buildImportedUpdateParam(input, existingTransactionIdMap);

            if (isDefined(importedUpdateParam)) {
                resultsOrder.push({ kind: 'update', index: updateParams.length });
                updateParams.push(importedUpdateParam);
            } else {
                resultsOrder.push({ kind: 'create', index: newInputs.length });
                newInputs.push(input);
            }
        }

        return { newInputs, updateParams, resultsOrder };
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
        const updated = await transactionRepository.updateById(
            transactionId,
            {
                title: input.title,
                comment: input.comment,
                operatedAt: input.operatedAt
            },
            tx
        );

        await this.refreshImportedTransactionEntries(transactionId, input, tx);

        return updated;
    }

    private async refreshImportedTransactionEntries(transactionId: number, input: TransactionCreateInputInterface, tx: DB): Promise<void> {
        const existingTransaction = await transactionRepository.getById(transactionId, tx);

        if (!isDefined(existingTransaction)) {
            return;
        }

        const refreshedEntries = this.buildRefreshedImportedEntries(existingTransaction.entries, input.entries, transactionId);

        if (!isDefined(refreshedEntries)) {
            return;
        }

        await transactionEntryRepository.deleteByTransactionId(transactionId, tx);
        await transactionEntryRepository.bulkCreate(refreshedEntries, tx);
    }

    private buildRefreshedImportedEntries(
        existingEntries: TransactionEntryEntityInterface[],
        inputEntries: TransactionEntryCreateInputInterface[],
        transactionId: number
    ): TransactionEntryCreateEntityInterface[] | null {
        if (existingEntries.length !== inputEntries.length) {
            return null;
        }

        const remainingInputEntries = [...inputEntries];
        const refreshedEntries = existingEntries.map(existingEntry => {
            const matchingInputIndex = this.findMatchingImportedEntryIndex(existingEntry, remainingInputEntries);

            if (!isDefined(matchingInputIndex)) {
                return null;
            }

            const [matchingInput] = remainingInputEntries.splice(matchingInputIndex, 1);

            return {
                transactionId,
                accountId: existingEntry.accountId,
                categoryId: existingEntry.categoryId,
                mccCategoryId: existingEntry.mccCategoryId,
                type: existingEntry.type,
                amount: existingEntry.amount,
                externalId: matchingInput.externalId ?? existingEntry.externalId,
                exchangeRate: matchingInput.exchangeRate ?? existingEntry.exchangeRate,
                toIban: matchingInput.toIban ?? existingEntry.toIban
            };
        });

        return refreshedEntries.every(isDefined) ? refreshedEntries : null;
    }

    private findMatchingImportedEntryIndex(
        existingEntry: TransactionEntryEntityInterface,
        inputEntries: TransactionEntryCreateInputInterface[]
    ): number | null {
        const externalIdMatchIndex = inputEntries.findIndex(
            inputEntry => isDefined(existingEntry.externalId) && inputEntry.externalId === existingEntry.externalId
        );

        if (externalIdMatchIndex >= 0) {
            return externalIdMatchIndex;
        }

        const fallbackMatchIndex = inputEntries.findIndex(
            inputEntry => inputEntry.accountId === existingEntry.accountId && inputEntry.type === existingEntry.type
        );

        return fallbackMatchIndex >= 0 ? fallbackMatchIndex : null;
    }
}

export const transactionService = new TransactionService();
