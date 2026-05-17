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
import { TRANSACTION_BATCH_SIZE } from '../constant/transaction-batch-size.constant';
import { buildAdditionalTransferEntries } from '../utils/build-additional-transfer-entries.util';
import { stampForDeferredEmbedding } from '../utils/stamp-for-deferred-embedding.util';
import { transactionMapTagIdsToCreateEntities } from '../utils/transaction-map-tag-ids-to-create-entities.util';
import { unconsolidateByIdInTransaction } from '../utils/unconsolidate-by-id-in-transaction.util';
import { upsertTransactionEntriesAndTags } from '../utils/upsert-transaction-entries-and-tags.util';

import { transactionBatchCreateService } from './transaction-batch-create.service';

import type {
    DB,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryCreateInputInterface,
    TransactionUpdateServiceInputInterface
} from '@budgie/contracts';

class TransactionService {
    @Log(
        (inputs, tx, batchSize) =>
            `enter externalIds=${inputs.map(input => input.externalId).join(',')} hasTx=${String(isDefined(tx))} batchSize=${batchSize}`,
        (result, inputs, tx, batchSize) =>
            `done externalIds=${inputs.map(input => input.externalId).join(',')} hasTx=${String(isDefined(tx))} batchSize=${batchSize} insertedIds=${result.map(row => row.id).join(',')}`,
        (error, inputs, tx, batchSize) =>
            `throw externalIds=${inputs.map(input => input.externalId).join(',')} hasTx=${String(isDefined(tx))} batchSize=${batchSize} error=${getErrorMessage(error)}`
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
            await accountBalanceIncrementalService.updateAllBalances(true, tx);
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
        await transactionAsync(db, async tx => this.updateImportedEntries(input.entries, input, tx));
    }

    @Log(id => `enter id=${id}`, 'done', (error, id) => `throw id=${id} error=${getErrorMessage(error)}`)
    async deleteById(id: number): Promise<void> {
        await transactionAsync(db, async tx => {
            const transaction = await transactionRepository.getByIdRaw(id, tx);

            if (isDefined(transaction?.consolidationType)) {
                await unconsolidateByIdInTransaction(id, tx);
            } else {
                await transactionRepository.deleteById(id, tx);
                await transactionTagsRepository.deleteByTransactionId(id, tx);
                await transactionEntryRepository.deleteByTransactionId(id, tx);
            }

            await accountBalanceIncrementalService.updateAllBalances(true, tx);
        });
    }

    @Log(id => `enter id=${id}`, 'done', (error, id) => `throw id=${id} error=${getErrorMessage(error)}`)
    async unconsolidateById(id: number): Promise<void> {
        await transactionAsync(db, async tx => {
            await unconsolidateByIdInTransaction(id, tx);
            await accountBalanceIncrementalService.updateAllBalances(true, tx);
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

            const primaryEntries = [
                { entry: fromEntry, type: TransactionEntryTypeEnum.CREDIT, amount: fromAmountInMicroUnits },
                { entry: toEntry, type: TransactionEntryTypeEnum.DEBIT, amount: toAmount }
            ].map(({ entry, type, amount }) => ({
                transactionId: transaction.id,
                accountId: entry.accountId,
                categoryId: entry.categoryId,
                mccCategoryId: entry.mccCategoryId,
                type,
                amount,
                externalId: entry.externalId ?? null,
                exchangeRate: entry.exchangeRate ?? 1,
                toIban: entry.toIban ?? null
            }));

            await transactionEntryRepository.bulkCreate(
                [...primaryEntries, ...buildAdditionalTransferEntries(input.entries, fromEntry, toEntry, transaction.id)],
                tx
            );

            if (isNotEmptyArray(input.tagIds)) {
                await transactionTagsRepository.bulkCreate(transactionMapTagIdsToCreateEntities(input.tagIds, transaction.id), tx);
            }

            await accountBalanceIncrementalService.updateAllBalances(true, tx);

            return transaction;
        });
    }

    async updateById(id: number, input: TransactionUpdateServiceInputInterface): Promise<TransactionEntityInterface> {
        return await transactionAsync(db, async tx => {
            const existingTransaction = await transactionRepository.getByIdRaw(id, tx);
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

            await upsertTransactionEntriesAndTags(id, input, tx, isConsolidated);

            await accountBalanceIncrementalService.updateAllBalances(true, tx);

            return transaction;
        });
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

    private async updateImportedEntries(
        entries: readonly TransactionEntryCreateInputInterface[],
        input: TransactionCreateInputInterface,
        tx: DB
    ): Promise<void> {
        const [entry, ...remainingEntries] = entries;
        if (!isDefined(entry)) {
            return;
        }

        await this.updateImportedEntry(entry, input, tx);
        await this.updateImportedEntries(remainingEntries, input, tx);
    }

    private async updateImportedEntry(
        entry: TransactionEntryCreateInputInterface,
        input: TransactionCreateInputInterface,
        tx: DB
    ): Promise<void> {
        if (!isDefined(entry.externalId)) {
            return;
        }

        const existingEntry = await transactionEntryRepository.findByExternalIdAndAccountId(entry.externalId, entry.accountId, tx);

        if (!isDefined(existingEntry)) {
            return;
        }

        const nextAmount = convertToMicroUnits(entry.amount);

        if (
            existingEntry.amount === nextAmount &&
            existingEntry.exchangeRate === entry.exchangeRate &&
            existingEntry.toIban === entry.toIban
        ) {
            return;
        }

        await transactionEntryRepository.updateByExternalIdAndAccountId(
            entry.externalId,
            entry.accountId,
            {
                amount: nextAmount,
                exchangeRate: entry.exchangeRate,
                toIban: entry.toIban
            },
            tx
        );

        const metadataTransactionId = existingEntry.originalTransactionId ?? existingEntry.transactionId;

        await transactionRepository.updateById(
            metadataTransactionId,
            {
                title: input.title,
                comment: input.comment,
                operatedAt: input.operatedAt
            },
            tx
        );
    }
}
export const transactionService = new TransactionService();
