/* eslint-disable max-lines -- approved by liaugust: one transaction service; merging main's deposit-safety guards pushed it past 500 */
import {
    type AccountEntityInterface,
    AccountTypeEnum,
    type DB,
    ExternalSourceEnum,
    type TransactionCreateInputInterface,
    type TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    type TransactionEntryCreateInputInterface,
    type TransactionEntryEntityInterface,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    type TransactionUpdateServiceInputInterface,
    TransactionUpdatedByEnum,
    type TransactionWithEntriesEntityInterface,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { i18n } from '@lingui/core';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import {
    accountRepository,
    db,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
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
import { transactionDebtSettlementService } from './transaction-debt-settlement.service';
import { transactionDepositSafetyService } from './transaction-deposit-safety.service';

import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';

class TransactionService {
    @Log(
        (inputs, tx, batchSize) =>
            `enter count=${inputs.length} firstExternalId=${inputs[0]?.externalId ?? ''} hasTx=${String(isDefined(tx))} batchSize=${batchSize}`,
        (result, inputs, tx, batchSize) =>
            `done count=${inputs.length} firstExternalId=${inputs[0]?.externalId ?? ''} hasTx=${String(isDefined(tx))} batchSize=${batchSize} firstInsertedId=${result[0]?.id ?? ''}`,
        (error, inputs, tx, batchSize) =>
            `throw count=${inputs.length} firstExternalId=${inputs[0]?.externalId ?? ''} hasTx=${String(isDefined(tx))} batchSize=${batchSize} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
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

        await transactionDepositSafetyService.assertNoDepositExpenseInputs(stampedInputs, tx);

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
    @InvalidateDatabaseLiveQuery()
    async update(input: TransactionCreateInputInterface): Promise<void> {
        await transactionAsync(db, async tx => {
            await transactionDepositSafetyService.assertNoDepositExpenseImportedUpdate(input, tx);
            await importedTransactionEntryUpdateService.update(input.entries, input, tx);
        });
    }

    @Log(id => `enter id=${id}`, 'done', (error, id) => `throw id=${id} error=${getErrorMessage(error)}`)
    @InvalidateDatabaseLiveQuery()
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
    @InvalidateDatabaseLiveQuery()
    async unconsolidateById(id: number): Promise<void> {
        await transactionAsync(db, async tx => {
            await unconsolidateByIdInTransaction(id, tx);
            await accountBalanceIncrementalService.updateAllBalances(true, tx);
        });
    }

    @Log(
        inputs => `enter externalIds=${inputs.map(input => input.externalId).join(',')}`,
        (result, inputs) =>
            `done ids=${result.map(transaction => transaction.id).join(',')} externalIds=${inputs.map(input => input.externalId).join(',')}`,
        (error, inputs) => `throw externalIds=${inputs.map(input => input.externalId).join(',')} error=${getErrorMessage(error)}`
    )
    async createSyncedTransfers(inputs: TransactionCreateInputInterface[]): Promise<TransactionEntityInterface[]> {
        if (inputs.some(input => input.exchangeRate !== 1)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal invariant
            throw new Error('Synced transfer exchange rate must be equal to 1');
        }

        return await transactionAsync(db, async tx => {
            const transactions: TransactionEntityInterface[] = [];
            for (const input of inputs) {
                // eslint-disable-next-line no-await-in-loop -- Sequential persists share one chunk transaction
                transactions.push(await this.persistSyncedTransfer(input, tx));
            }

            await accountBalanceIncrementalService.updateBalancesByAccountIds(this.getAccountIdsFromInputs(inputs), tx);

            return transactions;
        });
    }

    @Log(
        externalSource => `enter externalSource=${externalSource}`,
        (result, externalSource) => `done externalSource=${externalSource} externalIdCount=${result.size}`,
        (error, externalSource) => `throw externalSource=${externalSource} error=${getErrorMessage(error)}`
    )
    async findByExternalSource(externalSource: ExternalSourceEnum): Promise<Set<string>> {
        return new Set([...(await transactionRepository.findExternalIdsByExternalSource(externalSource))]);
    }

    @Log(
        externalSource => `enter externalSource=${externalSource}`,
        (result, externalSource) => `done externalSource=${externalSource} idMapSize=${result.size}`,
        (error, externalSource) => `throw externalSource=${externalSource} error=${getErrorMessage(error)}`
    )
    async findIdMapByExternalSource(externalSource: ExternalSourceEnum): Promise<Map<string, number>> {
        return transactionRepository.findIdMapByExternalSource(externalSource);
    }

    @Log(
        (transactionId, ...[externalId, accountId, isIncome]) =>
            `enter transactionId=${transactionId} externalId=${externalId} accountId=${accountId} isIncome=${String(isIncome)}`,
        (result, ...[transactionId, externalId, accountId, isIncome]) =>
            `done result=${String(result)} transactionId=${transactionId} externalId=${externalId} accountId=${accountId} isIncome=${String(isIncome)}`,
        (error, ...[transactionId, externalId, accountId, isIncome]) =>
            `throw transactionId=${transactionId} externalId=${externalId} accountId=${accountId} isIncome=${String(isIncome)} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async moveExternalEntryToAccount(transactionId: number, externalId: string, accountId: number, isIncome: boolean): Promise<boolean> {
        return transactionAsync(db, async tx => {
            const existingEntry = await transactionEntryRepository.findByTransactionIdAndExternalId(transactionId, externalId, tx);
            if (!isDefined(existingEntry) || existingEntry.accountId === accountId) {
                return false;
            }

            await transactionEntryRepository.updateById(existingEntry.id, { accountId }, tx);
            await transactionRepository.updateById(
                existingEntry.originalTransactionId ?? existingEntry.transactionId,
                isIncome ? { toAccountId: accountId } : { fromAccountId: accountId },
                tx
            );
            await accountBalanceIncrementalService.updateBalancesByAccountIds([existingEntry.accountId, accountId], tx);

            return true;
        });
    }

    @Log(
        accountId => `enter accountId=${accountId}`,
        (result, accountId) => `done accountId=${accountId} earliestAt=${result?.toISOString() ?? 'null'}`,
        (error, accountId) => `throw accountId=${accountId} error=${getErrorMessage(error)}`
    )
    async getEarliestTransactionTimeByAccountId(accountId: number): Promise<Date | null> {
        return transactionRepository.getTransactionTimeByAccountId(accountId, 'earliest');
    }

    @Log(
        externalSource => `enter externalSource=${externalSource}`,
        (result, externalSource) => `done externalSource=${externalSource} earliestAt=${result?.toISOString() ?? 'null'}`,
        (error, externalSource) => `throw externalSource=${externalSource} error=${getErrorMessage(error)}`
    )
    async getEarliestTransactionTimeByExternalSource(externalSource: ExternalSourceEnum): Promise<Date | null> {
        return transactionRepository.getEarliestTransactionTimeByExternalSource(externalSource);
    }

    @Log(
        tx => `enter hasTx=${String(isDefined(tx))}`,
        (_result, tx) => `done hasTx=${String(isDefined(tx))}`,
        (error, tx) => `throw hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async updateAllBalances(tx?: DB): Promise<void> {
        await accountBalanceIncrementalService.updateAllBalances(true, tx);
    }

    @Log(
        input => `enter type=${input.type} title="${input.title}"`,
        (result, input) => `done id=${result.id} type=${input.type} title="${input.title}"`,
        (error, input) => `throw type=${input.type} title="${input.title}" error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async createInternal(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        return transactionAsync(db, async tx => {
            const [transaction] = await this.bulkCreate([input], tx);

            return transaction;
        });
    }

    @Log(
        (input, tx) =>
            `enter type=${input.type} fromAccountId=${input.fromAccountId} toAccountId=${input.toAccountId} tx=${String(isDefined(tx))}`,
        (result, input, tx) =>
            `done id=${result.id} fromAccountId=${input.fromAccountId} toAccountId=${input.toAccountId} tx=${String(isDefined(tx))}`,
        (error, input, tx) =>
            `throw fromAccountId=${input.fromAccountId} toAccountId=${input.toAccountId} tx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery((_input, tx) => !isDefined(tx))
    async createInternalTransfer(input: TransactionCreateInputInterface, tx?: DB): Promise<TransactionEntityInterface> {
        if (!isDefined(tx)) {
            return transactionAsync(db, async innerTx => this.createInternalTransfer(input, innerTx));
        }

        return this.createInternalTransferInTransaction(input, tx);
    }

    @Log(
        (id, input) => `enter id=${id} type=${input.type} title="${input.title}"`,
        (_result, id, input) => `done id=${id} type=${input.type} title="${input.title}"`,
        (error, id, input) => `throw id=${id} type=${input.type} title="${input.title}" error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async updateById(id: number, input: TransactionUpdateServiceInputInterface): Promise<TransactionEntityInterface> {
        return await transactionAsync(db, async tx => {
            const existingTransaction = await transactionRepository.getByIdWithEntries(id, tx);
            await transactionDepositSafetyService.assertNoDepositExpenseInputs(
                [
                    {
                        entries: input.entries,
                        fromAccountId: input.fromAccountId ?? existingTransaction?.fromAccountId ?? null,
                        type: input.type ?? existingTransaction?.type ?? TransactionTypeEnum.EXPENSE
                    }
                ],
                tx
            );

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

    private async persistSyncedTransfer(input: TransactionCreateInputInterface, tx: DB): Promise<TransactionEntityInterface> {
        const { fromEntry, toEntry } = this.findPrimaryEntries(input.entries, input.fromAccountId, input.toAccountId);
        const transaction = await transactionRepository.create({ ...input, exchangeRate: 1 }, tx);
        await this.persistPrimaryTransfer(
            transaction,
            input,
            fromEntry,
            toEntry,
            convertToMicroUnits(fromEntry.amount),
            convertToMicroUnits(toEntry.amount),
            tx
        );

        return transaction;
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Transfer persistence keeps positional arguments instead of a single-consumer param-bag interface
    private async persistPrimaryTransfer(
        transaction: TransactionEntityInterface,
        input: TransactionCreateInputInterface,
        fromEntry: TransactionEntryCreateInputInterface,
        toEntry: TransactionEntryCreateInputInterface,
        fromAmountInMicroUnits: number,
        toAmountInMicroUnits: number,
        tx: DB
    ): Promise<void> {
        const additionalEntryValuations = await entryBaseValuationService.valueEntries(
            input.entries,
            input.operatedAt,
            input.externalSource,
            tx
        );
        const [fromValuation, toValuation] = await Promise.all([
            this.valueTransferLeg(fromEntry.accountId, fromAmountInMicroUnits, input, tx),
            this.valueTransferLeg(toEntry.accountId, toAmountInMicroUnits, input, tx)
        ]);

        const primaryEntries = [
            this.buildPrimaryTransferEntry(
                transaction.id,
                fromEntry,
                TransactionEntryTypeEnum.CREDIT,
                fromAmountInMicroUnits,
                fromValuation
            ),
            this.buildPrimaryTransferEntry(transaction.id, toEntry, TransactionEntryTypeEnum.DEBIT, toAmountInMicroUnits, toValuation)
        ];

        await this.persistTransfer(transaction, input, primaryEntries, fromEntry, toEntry, additionalEntryValuations, tx);
    }

    private async valueTransferLeg(
        accountId: number,
        amount: number,
        input: TransactionCreateInputInterface,
        tx: DB
    ): Promise<EntryBaseValuationInterface> {
        return entryBaseValuationService.valueMicroUnitEntry({
            accountId,
            amount,
            operatedAt: input.operatedAt,
            externalSource: input.externalSource,
            tx
        });
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Entry construction keeps positional arguments instead of a single-consumer param-bag interface
    private buildPrimaryTransferEntry(
        transactionId: number,
        entry: TransactionEntryCreateInputInterface,
        type: TransactionEntryTypeEnum,
        amount: number,
        valuation: EntryBaseValuationInterface
    ): TransactionEntryCreateEntityInterface {
        return {
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
        };
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Transfer persistence keeps positional arguments instead of a single-consumer param-bag interface
    private async persistTransfer(
        transaction: TransactionEntityInterface,
        input: TransactionCreateInputInterface,
        primaryEntries: readonly TransactionEntryCreateEntityInterface[],
        fromEntry: TransactionEntryCreateInputInterface,
        toEntry: TransactionEntryCreateInputInterface,
        additionalEntryValuations: Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>,
        tx: DB
    ): Promise<void> {
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
    }

    private getAccountIdsFromInputs(inputs: readonly Pick<TransactionCreateInputInterface, 'entries'>[]): number[] {
        return [...new Set(inputs.flatMap(input => input.entries.map(entry => entry.accountId)))];
    }

    private getAccountIdsFromTransactions(transactions: readonly TransactionWithEntriesEntityInterface[]): number[] {
        return [...new Set(transactions.flatMap(transaction => transaction.entries.map(entry => entry.accountId)))];
    }

    private async createInternalTransferInTransaction(input: TransactionCreateInputInterface, tx: DB): Promise<TransactionEntityInterface> {
        const { fromEntry, toEntry } = this.findPrimaryEntries(input.entries, input.fromAccountId, input.toAccountId);
        const [fromAccount, toAccount] = await Promise.all([
            this.findAccountByIdOrFail(fromEntry.accountId, tx),
            this.findAccountByIdOrFail(toEntry.accountId, tx)
        ]);
        const fromAmountInMicroUnits = convertToMicroUnits(fromEntry.amount);
        const { amount: toAmount, exchangeRate } = await this.getTransferAmountAndExchangeRate(
            input,
            fromAccount,
            toAccount,
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
        const createdEntries = await this.createTransferEntries(
            transaction,
            input,
            { fromEntry, toEntry, fromAmountInMicroUnits, toAmount },
            tx
        );

        if (isDebtTransaction) {
            await transactionDebtSettlementService.createFromTransfer(transaction, createdEntries, [fromAccount, toAccount], tx);
        }

        await this.finalizeInternalTransfer(input, transaction.id, tx);

        return transaction;
    }

    private async findAccountByIdOrFail(id: number, tx: DB): Promise<AccountEntityInterface> {
        const account = await accountRepository.findById(id, tx);

        if (!isDefined(account)) {
            throw new Error(i18n._({ id: 'transaction.accountNotFound', message: 'Account not found' }));
        }

        return account;
    }

    private async getTransferAmountAndExchangeRate(
        input: TransactionCreateInputInterface,
        fromAccount: AccountEntityInterface,
        toAccount: AccountEntityInterface,
        fromAmountInMicroUnits: number
    ) {
        const hasCustomExchangeRate = isPositiveNumber(input.exchangeRate) && input.exchangeRate !== 1;
        const { amount, exchangeRate } = await exchangeRatesService.convert(
            fromAccount.instrumentId,
            toAccount.instrumentId,
            fromAmountInMicroUnits
        );

        return {
            amount: hasCustomExchangeRate ? fromAmountInMicroUnits / input.exchangeRate : amount,
            exchangeRate: hasCustomExchangeRate ? input.exchangeRate : exchangeRate
        };
    }

    private async createTransferEntries(
        transaction: TransactionEntityInterface,
        input: TransactionCreateInputInterface,
        primaryEntryInput: {
            readonly fromEntry: TransactionEntryCreateInputInterface;
            readonly toEntry: TransactionEntryCreateInputInterface;
            readonly fromAmountInMicroUnits: number;
            readonly toAmount: number;
        },
        tx: DB
    ): Promise<TransactionEntryEntityInterface[]> {
        const additionalEntryValuations = await entryBaseValuationService.valueEntries(
            input.entries,
            input.operatedAt,
            input.externalSource,
            tx
        );
        const [fromValuation, toValuation] = await Promise.all([
            entryBaseValuationService.valueMicroUnitEntry({
                accountId: primaryEntryInput.fromEntry.accountId,
                amount: primaryEntryInput.fromAmountInMicroUnits,
                operatedAt: input.operatedAt,
                externalSource: input.externalSource,
                tx
            }),
            entryBaseValuationService.valueMicroUnitEntry({
                accountId: primaryEntryInput.toEntry.accountId,
                amount: primaryEntryInput.toAmount,
                operatedAt: input.operatedAt,
                externalSource: input.externalSource,
                tx
            })
        ]);
        const primaryEntries = [
            {
                entry: primaryEntryInput.fromEntry,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: primaryEntryInput.fromAmountInMicroUnits,
                valuation: fromValuation
            },
            {
                entry: primaryEntryInput.toEntry,
                type: TransactionEntryTypeEnum.DEBIT,
                amount: primaryEntryInput.toAmount,
                valuation: toValuation
            }
        ].map(({ entry, type, amount, valuation }) => ({
            transactionId: transaction.id,
            accountId: entry.accountId,
            categoryId: entry.categoryId,
            mccCategoryId: entry.mccCategoryId,
            type,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            externalId: entry.externalId ?? null,
            exchangeRate: entry.exchangeRate ?? 1,
            baseInstrumentId: valuation.baseInstrumentId,
            baseExchangeRate: valuation.baseExchangeRate,
            baseAmount: valuation.baseAmount,
            toIban: entry.toIban ?? null
        }));

        return transactionEntryRepository.bulkCreate(
            [
                ...primaryEntries,
                ...buildAdditionalTransferEntries({
                    entries: input.entries,
                    fromEntry: primaryEntryInput.fromEntry,
                    toEntry: primaryEntryInput.toEntry,
                    transactionId: transaction.id,
                    valuations: additionalEntryValuations
                })
            ],
            tx
        );
    }

    private async finalizeInternalTransfer(input: TransactionCreateInputInterface, transactionId: number, tx: DB): Promise<void> {
        if (isNotEmptyArray(input.tagIds)) {
            await transactionTagsRepository.bulkCreate(transactionMapTagIdsToCreateEntities(input.tagIds, transactionId), tx);
        }

        await accountBalanceIncrementalService.updateBalancesByAccountIds(this.getAccountIdsFromInputs([input]), tx);
    }

    private findPrimaryEntries(entries: TransactionEntryCreateInputInterface[], fromAccountId: number | null, toAccountId: number | null) {
        const fromEntry = entries.find(
            ({ accountId, kind, type }) =>
                accountId === fromAccountId && type === TransactionEntryTypeEnum.CREDIT && kind === TransactionEntryKindEnum.PRIMARY
        );
        const toEntry = entries.find(
            ({ accountId, kind, type }) =>
                accountId === toAccountId && type === TransactionEntryTypeEnum.DEBIT && kind === TransactionEntryKindEnum.PRIMARY
        );

        if (!isDefined(fromEntry) || !isDefined(toEntry)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
            throw new Error('Transfer must have exactly two entries');
        }

        return { fromEntry, toEntry };
    }
}
export const transactionService = new TransactionService();
