/* eslint-disable max-lines -- File owns the cohesive transaction-service: bulk create, dual transfer orchestration (internal + synced), update, and shared transfer valuation/persistence helpers -- approved by human */
import {
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionUpdatedByEnum,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { accountService } from '../../account/service/account.service';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { TRANSACTION_BATCH_SIZE } from '../constant/transaction-batch-size.constant';
import { buildAdditionalTransferEntries } from '../utils/build-additional-transfer-entries.util';
import { stampForDeferredEmbedding } from '../utils/stamp-for-deferred-embedding.util';
import { transactionMapTagIdsToCreateEntities } from '../utils/transaction-map-tag-ids-to-create-entities.util';
import { unconsolidateByIdInTransaction } from '../utils/unconsolidate-by-id-in-transaction.util';
import { upsertTransactionEntriesAndTags } from '../utils/upsert-transaction-entries-and-tags.util';

import { importedTransactionEntryUpdateService } from './imported-transaction-entry-update.service';
import { transactionBatchCreateService } from './transaction-batch-create.service';

import type { PersistTransferInputInterface } from '../interface/persist-transfer-input.interface';
import type { TransferLegValuationsInterface } from '../interface/transfer-leg-valuations.interface';
import type { ValueTransferLegsInputInterface } from '../interface/value-transfer-legs-input.interface';
import type { ValuedTransferEntryInterface } from '../interface/valued-transfer-entry.interface';
import type {
    DB,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryCreateInputInterface,
    TransactionUpdateServiceInputInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

class TransactionService {
    @Log(
        (inputs, tx, batchSize) =>
            `enter count=${inputs.length} firstExternalId=${inputs[0]?.externalId ?? ''} hasTx=${String(isDefined(tx))} batchSize=${batchSize}`,
        (result, inputs, tx, batchSize) =>
            `done count=${inputs.length} firstExternalId=${inputs[0]?.externalId ?? ''} hasTx=${String(isDefined(tx))} batchSize=${batchSize} firstInsertedId=${result[0]?.id ?? ''}`,
        (error, inputs, tx, batchSize) =>
            `throw count=${inputs.length} firstExternalId=${inputs[0]?.externalId ?? ''} hasTx=${String(isDefined(tx))} batchSize=${batchSize} error=${getErrorMessage(error)}`
    )
    async bulkCreate(
        inputs: TransactionCreateInputInterface[],
        tx?: DB,
        batchSize = TRANSACTION_BATCH_SIZE
    ): Promise<TransactionEntityInterface[]> {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        if (!isDefined(tx)) {
            return transactionAsync(db, async innerTx => this.bulkCreate(inputs, innerTx, batchSize));
        }

        const { stampedInputs } = stampForDeferredEmbedding(inputs, 'bulkCreate');
        const transactions = await processInputWithBatches(stampedInputs, batchSize, batch =>
            transactionBatchCreateService.create(batch, tx)
        );

        if (isNotEmptyArray(transactions)) {
            await accountBalanceIncrementalService.updateBalancesByAccountIds(this.getAccountIdsFromInputs(inputs), tx);
        }

        return transactions;
    }

    @Log(
        input => `enter externalId=${input.externalId} entryExternalIds=${input.entries.map(entry => entry.externalId).join(',')}`,
        (result, input) =>
            `done result=${String(result)} externalId=${input.externalId} entryExternalIds=${input.entries.map(entry => entry.externalId).join(',')}`,
        (error, input) =>
            `throw externalId=${input.externalId} entryExternalIds=${input.entries.map(entry => entry.externalId).join(',')} error=${getErrorMessage(error)}`
    )
    async update(input: TransactionCreateInputInterface): Promise<void> {
        await transactionAsync(db, async tx => importedTransactionEntryUpdateService.update(input.entries, input, tx));
    }

    @Log(id => `enter id=${id}`, 'done', (error, id) => `throw id=${id} error=${getErrorMessage(error)}`)
    async deleteById(id: number): Promise<void> {
        await transactionAsync(db, async tx => {
            const transaction = await transactionRepository.getByIdWithEntries(id, tx);
            const accountIds = this.getAccountIdsFromTransactions(isDefined(transaction) ? [transaction] : []);

            if (isDefined(transaction?.consolidationType)) {
                await unconsolidateByIdInTransaction(id, tx);
                await accountBalanceIncrementalService.updateAllBalances(true, tx);
            } else {
                await transactionRepository.deleteById(id, tx);
                await transactionTagsRepository.deleteByTransactionId(id, tx);
                await transactionEntryRepository.deleteByTransactionId(id, tx);
                await accountBalanceIncrementalService.updateBalancesByAccountIds(accountIds, tx);
            }
        });
    }

    @Log(id => `enter id=${id}`, 'done', (error, id) => `throw id=${id} error=${getErrorMessage(error)}`)
    async unconsolidateById(id: number): Promise<void> {
        await transactionAsync(db, async tx => {
            await unconsolidateByIdInTransaction(id, tx);
            await accountBalanceIncrementalService.updateAllBalances(true, tx);
        });
    }

    @Log(
        input => `enter externalId=${input.externalId} fromAccountId=${input.fromAccountId} toAccountId=${input.toAccountId}`,
        (result, input) => `done id=${result.id} externalId=${input.externalId}`,
        (error, input) => `throw externalId=${input.externalId} error=${getErrorMessage(error)}`
    )
    async createSyncedTransfer(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        if (input.exchangeRate !== 1) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal invariant
            throw new Error('Synced transfer exchange rate must be equal to 1');
        }

        return await transactionAsync(db, async tx => {
            const { fromEntry, toEntry } = this.findPrimaryEntries(input.entries, input.fromAccountId, input.toAccountId);

            const fromAmountInMicroUnits = convertToMicroUnits(fromEntry.amount);
            const toAmountInMicroUnits = convertToMicroUnits(toEntry.amount);

            const transaction = await transactionRepository.create({ ...input, exchangeRate: 1 }, tx);

            const { additionalEntryValuations, fromValuation, toValuation } = await this.valueTransferLegs({
                input,
                fromEntry,
                toEntry,
                fromAmountInMicroUnits,
                toAmountInMicroUnits,
                tx
            });

            const primaryEntries = this.buildPrimaryTransferEntries(transaction.id, [
                { entry: fromEntry, type: TransactionEntryTypeEnum.CREDIT, amount: fromAmountInMicroUnits, valuation: fromValuation },
                { entry: toEntry, type: TransactionEntryTypeEnum.DEBIT, amount: toAmountInMicroUnits, valuation: toValuation }
            ]);

            await this.persistTransfer({ transaction, input, primaryEntries, fromEntry, toEntry, additionalEntryValuations, tx });

            return transaction;
        });
    }

    async findByExternalSource(externalSource: ExternalSourceEnum): Promise<Set<string>> {
        return new Set([...(await transactionRepository.findExternalIdsByExternalSource(externalSource))]);
    }

    async findIdMapByExternalSource(externalSource: ExternalSourceEnum): Promise<Map<string, number>> {
        return transactionRepository.findIdMapByExternalSource(externalSource);
    }

    async getEarliestTransactionTimeByAccountId(accountId: number): Promise<Date | null> {
        return transactionRepository.getTransactionTimeByAccountId(accountId, 'earliest');
    }

    async getEarliestTransactionTimeByExternalSource(externalSource: ExternalSourceEnum): Promise<Date | null> {
        return transactionRepository.getEarliestTransactionTimeByExternalSource(externalSource);
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

    async createInternalTransfer(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        // eslint-disable-next-line max-statements -- Transfer creation with optional custom exchange rate and debt handling
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
            const { additionalEntryValuations, fromValuation, toValuation } = await this.valueTransferLegs({
                input,
                fromEntry,
                toEntry,
                fromAmountInMicroUnits,
                toAmountInMicroUnits: toAmount,
                tx
            });

            const primaryEntries = this.buildPrimaryTransferEntries(transaction.id, [
                { entry: fromEntry, type: TransactionEntryTypeEnum.CREDIT, amount: fromAmountInMicroUnits, valuation: fromValuation },
                { entry: toEntry, type: TransactionEntryTypeEnum.DEBIT, amount: toAmount, valuation: toValuation }
            ]);

            await this.persistTransfer({ transaction, input, primaryEntries, fromEntry, toEntry, additionalEntryValuations, tx });

            return transaction;
        });
    }

    async updateById(id: number, input: TransactionUpdateServiceInputInterface): Promise<TransactionEntityInterface> {
        return await transactionAsync(db, async tx => {
            const existingTransaction = await transactionRepository.getByIdWithEntries(id, tx);
            const isConsolidated = isDefined(existingTransaction?.consolidationType);
            const transaction = await transactionRepository.updateById(
                id,
                {
                    title: input.title,
                    comment: input.comment,
                    type: input.type,
                    operatedAt: input.operatedAt,
                    fromAccountId: input.fromAccountId,
                    toAccountId: input.toAccountId,
                    exchangeRate: input.exchangeRate,
                    updatedBy: TransactionUpdatedByEnum.USER
                },
                tx
            );

            await upsertTransactionEntriesAndTags({ transactionId: id, input, operatedAt: transaction.operatedAt, isConsolidated }, tx);

            await accountBalanceIncrementalService.updateBalancesByAccountIds(
                [
                    ...this.getAccountIdsFromTransactions(isDefined(existingTransaction) ? [existingTransaction] : []),
                    ...this.getAccountIdsFromInputs([input])
                ],
                tx
            );

            return transaction;
        });
    }

    private async valueTransferLegs({
        input,
        fromEntry,
        toEntry,
        fromAmountInMicroUnits,
        toAmountInMicroUnits,
        tx
    }: ValueTransferLegsInputInterface): Promise<TransferLegValuationsInterface> {
        const additionalEntryValuations = await entryBaseValuationService.valueEntries(
            input.entries,
            input.operatedAt,
            input.externalSource,
            tx
        );
        const [fromValuation, toValuation] = await Promise.all([
            entryBaseValuationService.valueMicroUnitEntry({
                accountId: fromEntry.accountId,
                amount: fromAmountInMicroUnits,
                operatedAt: input.operatedAt,
                externalSource: input.externalSource,
                tx
            }),
            entryBaseValuationService.valueMicroUnitEntry({
                accountId: toEntry.accountId,
                amount: toAmountInMicroUnits,
                operatedAt: input.operatedAt,
                externalSource: input.externalSource,
                tx
            })
        ]);

        return { additionalEntryValuations, fromValuation, toValuation };
    }

    private buildPrimaryTransferEntries(
        transactionId: number,
        valuedEntries: readonly ValuedTransferEntryInterface[]
    ): TransactionEntryCreateEntityInterface[] {
        return valuedEntries.map(({ entry, type, amount, valuation }) => ({
            transactionId,
            accountId: entry.accountId,
            categoryId: entry.categoryId,
            mccCategoryId: entry.mccCategoryId,
            type,
            amount,
            externalId: entry.externalId ?? null,
            exchangeRate: entry.exchangeRate ?? 1,
            baseInstrumentId: valuation.baseInstrumentId,
            baseExchangeRate: valuation.baseExchangeRate,
            baseAmount: valuation.baseAmount,
            toIban: entry.toIban ?? null
        }));
    }

    private async persistTransfer({
        transaction,
        input,
        primaryEntries,
        fromEntry,
        toEntry,
        additionalEntryValuations,
        tx
    }: PersistTransferInputInterface): Promise<void> {
        await transactionEntryRepository.bulkCreate(
            [
                ...primaryEntries,
                ...buildAdditionalTransferEntries({
                    entries: input.entries,
                    fromEntry,
                    toEntry,
                    transactionId: transaction.id,
                    valuations: additionalEntryValuations
                })
            ],
            tx
        );

        if (isNotEmptyArray(input.tagIds)) {
            await transactionTagsRepository.bulkCreate(transactionMapTagIdsToCreateEntities(input.tagIds, transaction.id), tx);
        }

        await accountBalanceIncrementalService.updateBalancesByAccountIds(this.getAccountIdsFromInputs([input]), tx);
    }

    private getAccountIdsFromInputs(inputs: readonly Pick<TransactionCreateInputInterface, 'entries'>[]): number[] {
        return [...new Set(inputs.flatMap(input => input.entries.map(entry => entry.accountId)))];
    }

    private getAccountIdsFromTransactions(transactions: readonly TransactionWithEntriesEntityInterface[]): number[] {
        return [...new Set(transactions.flatMap(transaction => transaction.entries.map(entry => entry.accountId)))];
    }

    private findPrimaryEntries(entries: TransactionEntryCreateInputInterface[], fromAccountId: number | null, toAccountId: number | null) {
        const fromEntry = entries.find(({ accountId, type }) => accountId === fromAccountId && type === TransactionEntryTypeEnum.CREDIT);
        const toEntry = entries.find(({ accountId, type }) => accountId === toAccountId && type === TransactionEntryTypeEnum.DEBIT);

        if (!isDefined(fromEntry) || !isDefined(toEntry)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
            throw new Error('Transfer must have exactly two entries');
        }

        return { fromEntry, toEntry };
    }
}
export const transactionService = new TransactionService();
