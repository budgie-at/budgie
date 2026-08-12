import {
    AccountDebtTypeEnum,
    type AccountEntityInterface,
    AccountTypeEnum,
    type DB,
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    ExternalSourceEnum,
    type TransactionCreateInputInterface,
    type TransactionEntityInterface,
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
import { i18n, type MessageDescriptor } from '@lingui/core';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import {
    accountRepository,
    db,
    debtEventRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { DepositTransactionSafetyErrorEnum } from '../../account/enum/deposit-transaction-safety-error.enum';
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

        await this.assertNoDepositExpenseInputs(stampedInputs, tx);

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
            await this.assertNoDepositExpenseImportedUpdate(input, tx);
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

    @InvalidateDatabaseLiveQuery()
    async createInternal(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        return transactionAsync(db, async tx => {
            const [transaction] = await this.bulkCreate([input], tx);

            return transaction;
        });
    }

    @InvalidateDatabaseLiveQuery((_input, tx) => !isDefined(tx))
    async createInternalTransfer(input: TransactionCreateInputInterface, tx?: DB): Promise<TransactionEntityInterface> {
        if (!isDefined(tx)) {
            return transactionAsync(db, async innerTx => this.createInternalTransfer(input, innerTx));
        }

        return this.createInternalTransferInTransaction(input, tx);
    }

    @InvalidateDatabaseLiveQuery()
    async updateById(id: number, input: TransactionUpdateServiceInputInterface): Promise<TransactionEntityInterface> {
        return await transactionAsync(db, async tx => {
            const existingTransaction = await transactionRepository.getByIdWithEntries(id, tx);
            await this.assertNoDepositExpenseInputs(
                [
                    {
                        ...input,
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

    async findIdMapByExternalSource(externalSource: ExternalSourceEnum): Promise<Map<string, number>> {
        return transactionRepository.findIdMapByExternalSource(externalSource);
    }

    async getEarliestTransactionTimeByAccountId(accountId: number): Promise<Date | null> {
        return transactionRepository.getTransactionTimeByAccountId(accountId, 'earliest');
    }

    private getAccountIdsFromInputs(inputs: readonly Pick<TransactionCreateInputInterface, 'entries'>[]): number[] {
        return [...new Set(inputs.flatMap(input => input.entries.map(entry => entry.accountId)))];
    }

    private getAccountIdsFromTransactions(transactions: readonly TransactionWithEntriesEntityInterface[]): number[] {
        return [...new Set(transactions.flatMap(transaction => transaction.entries.map(entry => entry.accountId)))];
    }

    private async assertNoDepositExpenseInputs(
        inputs: readonly {
            readonly entries: readonly Pick<TransactionEntryCreateInputInterface, 'accountId' | 'type'>[];
            readonly fromAccountId?: number | null;
            readonly type: TransactionTypeEnum;
        }[],
        tx: DB
    ): Promise<void> {
        const expenseSourceAccountIds = [
            ...new Set(
                inputs.flatMap(input =>
                    input.type === TransactionTypeEnum.EXPENSE
                        ? [
                              ...(isDefined(input.fromAccountId) ? [input.fromAccountId] : []),
                              ...input.entries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT).map(entry => entry.accountId)
                          ]
                        : []
                )
            )
        ];

        if (!isNotEmptyArray(expenseSourceAccountIds)) {
            return;
        }

        const accounts = await accountRepository.findByIds(expenseSourceAccountIds, tx);
        const hasDepositAccount = accounts.some(account => account.type === AccountTypeEnum.DEPOSIT);

        if (hasDepositAccount) {
            throw new Error(
                this.getErrorMessage({
                    id: DepositTransactionSafetyErrorEnum.DEPOSIT_EXPENSE
                })
            );
        }
    }

    private async assertNoDepositExpenseImportedUpdate(input: TransactionCreateInputInterface, tx: DB): Promise<void> {
        const existingEntries = (await Promise.all(input.entries.map(entry => this.findExistingImportedUpdateEntry(entry, tx)))).filter(
            isDefined
        );

        if (!isNotEmptyArray(existingEntries)) {
            return;
        }

        const transactionIds = [...new Set(existingEntries.map(entry => entry.originalTransactionId ?? entry.transactionId))];
        const transactions = await transactionRepository.findByIds(transactionIds, tx);

        await this.assertNoDepositExpenseInputs(transactions, tx);
    }

    private async findExistingImportedUpdateEntry(
        entry: Pick<TransactionEntryCreateInputInterface, 'accountId' | 'externalId'>,
        tx: DB
    ): Promise<TransactionEntryEntityInterface | null> {
        if (!isDefined(entry.externalId)) {
            return null;
        }

        return (await transactionEntryRepository.findByExternalIdAndAccountId(entry.externalId, entry.accountId, tx)) ?? null;
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
            await this.createDebtEventFromTransfer(transaction, createdEntries, [fromAccount, toAccount], tx);
        }

        await this.finalizeInternalTransfer(input, transaction.id, tx);

        return transaction;
    }

    private async findAccountByIdOrFail(id: number, tx: DB): Promise<AccountEntityInterface> {
        const account = await accountRepository.findById(id, tx);

        if (!isDefined(account)) {
            throw new Error(
                this.getErrorMessage({
                    id: DepositTransactionSafetyErrorEnum.ACCOUNT_NOT_FOUND
                })
            );
        }

        return account;
    }

    private getErrorMessage(messageDescriptor: MessageDescriptor): string {
        return isNotEmptyString(i18n.locale) ? i18n._(messageDescriptor) : messageDescriptor.id;
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
            // oxlint-disable-next-line lingui/no-unlocalized-strings -- Internal error
            throw new Error('Transfer must have exactly two entries');
        }

        return { fromEntry, toEntry };
    }

    private async createDebtEventFromTransfer(
        transaction: TransactionEntityInterface,
        entries: TransactionEntryEntityInterface[],
        accounts: readonly AccountEntityInterface[],
        tx: DB
    ): Promise<void> {
        const debtAccount = accounts.find(account => account.type === AccountTypeEnum.DEBT);
        if (!isDefined(debtAccount)) {
            return;
        }

        const debtEntry = entries.find(entry => entry.accountId === debtAccount.id);

        if (!isDefined(debtEntry)) {
            return;
        }

        await debtEventRepository.create(
            {
                debtAccountId: debtAccount.id,
                transactionId: transaction.id,
                transactionEntryId: debtEntry.id,
                direction: this.getTransferDebtEventDirection(debtAccount.debtType, debtEntry.type),
                source: DebtEventSourceEnum.TRANSFER,
                amount: debtEntry.amount,
                baseInstrumentId: debtEntry.baseInstrumentId,
                baseExchangeRate: debtEntry.baseExchangeRate,
                baseAmount: debtEntry.baseAmount,
                operatedAt: transaction.operatedAt
            },
            tx
        );
    }

    private getTransferDebtEventDirection(debtType: AccountDebtTypeEnum, entryType: TransactionEntryTypeEnum): DebtEventDirectionEnum {
        if (debtType === AccountDebtTypeEnum.LENT) {
            return entryType === TransactionEntryTypeEnum.DEBIT ? DebtEventDirectionEnum.OPEN : DebtEventDirectionEnum.CLOSE;
        }

        return entryType === TransactionEntryTypeEnum.CREDIT ? DebtEventDirectionEnum.OPEN : DebtEventDirectionEnum.CLOSE;
    }
}
export const transactionService = new TransactionService();
