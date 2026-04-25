import { AccountTypeEnum, ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { accountService } from '../../account/service/account.service';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { TRANSACTION_BATCH_SIZE } from '../constant/transaction-batch-size.constant';
import { stampForDeferredEmbedding } from '../utils/stamp-for-deferred-embedding.util';
import { transactionMapEntryInputToCreateEntity } from '../utils/transaction-map-entry-input-to-create-entity.util';
import { transactionMapTagIdsToCreateEntities } from '../utils/transaction-map-tag-ids-to-create-entities.util';

import { transactionBatchCreateService } from './transaction-batch-create.service';

import type {
    DB,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryCreateInputInterface
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
                await transactionTagsRepository.bulkCreate(transactionMapTagIdsToCreateEntities(input.tagIds, transaction.id), tx);
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

    private buildAdditionalEntries(
        entries: TransactionEntryCreateInputInterface[],
        fromEntry: TransactionEntryCreateInputInterface,
        toEntry: TransactionEntryCreateInputInterface,
        transactionId: number
    ): TransactionEntryCreateEntityInterface[] {
        return entries
            .filter(entry => entry !== fromEntry && entry !== toEntry)
            .map(entry => transactionMapEntryInputToCreateEntity(entry, transactionId));
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

    private async upsertEntriesAndTags(transactionId: number, input: TransactionCreateInputInterface, tx: DB): Promise<void> {
        await transactionEntryRepository.deleteByTransactionId(transactionId, tx);
        await transactionEntryRepository.bulkCreate(
            input.entries.map(entry => transactionMapEntryInputToCreateEntity(entry, transactionId)),
            tx
        );

        await transactionTagsRepository.deleteByTransactionId(transactionId, tx);
        if (isNotEmptyArray(input.tagIds)) {
            await transactionTagsRepository.bulkCreate(transactionMapTagIdsToCreateEntities(input.tagIds, transactionId), tx);
        }
    }
}

export const transactionService = new TransactionService();
