/* eslint-disable max-lines -- approved by liaugust: one transaction service; merging main's deposit-safety guards pushed it past 500 */
import {
    type AccountEntityInterface,
    Db,
    ExternalSourceEnum,
    type TransactionCreateInputInterface,
    type TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    type TransactionEntryCreateInputInterface,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    type TransactionUpdateServiceInputInterface,
    TransactionUpdatedByEnum,
    type TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import { i18n } from '@lingui/core';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import {
    accountRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { TRANSACTION_BATCH_SIZE } from '../constant/transaction-batch-size.constant';
import { assertTransferAccountsAreNotDebt } from '../utils/assert-transfer-accounts-are-not-debt.util';
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
    readonly bulkCreate = Effect.fn('TransactionService.bulkCreate')(
        function* (this: TransactionService, inputs: TransactionCreateInputInterface[], batchSize: number = TRANSACTION_BATCH_SIZE) {
            if (!isNotEmptyArray(inputs)) {
                return [];
            }

            const stampedInputs = stampForDeferredEmbedding(inputs);

            yield* transactionDepositSafetyService.assertNoDepositExpenseInputs(stampedInputs);

            const transactions = yield* processInputWithBatches(stampedInputs, batchSize, batch =>
                transactionBatchCreateService.create(batch)
            );

            if (isNotEmptyArray(transactions)) {
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds(this.getAccountIdsFromInputs(inputs));
            }

            return transactions;
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly update = Effect.fn('TransactionService.update')(
        function* (input: TransactionCreateInputInterface) {
            yield* transactionDepositSafetyService.assertNoDepositExpenseImportedUpdate(input);
            yield* importedTransactionEntryUpdateService.update(input.entries, input);
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly deleteById = Effect.fn('TransactionService.deleteById')(
        function* (this: TransactionService, id: number) {
            const transaction = yield* transactionRepository.getByIdWithEntries(id);
            const accountIds = this.getAccountIdsFromTransactions(isDefined(transaction) ? [transaction] : []);

            if (isDefined(transaction?.consolidationType)) {
                yield* unconsolidateByIdInTransaction(id);
                yield* accountBalanceIncrementalService.updateAllBalances(true);
            } else {
                yield* transactionRepository.deleteById(id);
                yield* transactionTagsRepository.deleteByTransactionId(id);
                yield* transactionEntryRepository.deleteByTransactionId(id);
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds(accountIds);
            }
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly unconsolidateById = Effect.fn('TransactionService.unconsolidateById')(
        function* (id: number) {
            yield* unconsolidateByIdInTransaction(id);
            yield* accountBalanceIncrementalService.updateAllBalances(true);
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly createSyncedTransfers = Effect.fn('TransactionService.createSyncedTransfers')(
        function* (this: TransactionService, inputs: TransactionCreateInputInterface[]) {
            if (inputs.some(input => input.exchangeRate !== 1)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal invariant
                return yield* Effect.die(new Error('Synced transfer exchange rate must be equal to 1'));
            }

            const transactions: TransactionEntityInterface[] = [];
            for (const input of inputs) {
                transactions.push(yield* this.persistSyncedTransfer(input));
            }

            yield* accountBalanceIncrementalService.updateBalancesByAccountIds(this.getAccountIdsFromInputs(inputs));

            return transactions;
        },
        effect => Db.transaction(effect)
    );

    readonly findByExternalSource = Effect.fn('TransactionService.findByExternalSource')(function* (externalSource: ExternalSourceEnum) {
        return new Set([...(yield* transactionRepository.findExternalIdsByExternalSource(externalSource))]);
    });

    readonly findIdMapByExternalSource = Effect.fn('TransactionService.findIdMapByExternalSource')(function* (
        externalSource: ExternalSourceEnum
    ) {
        return yield* transactionRepository.findIdMapByExternalSource(externalSource);
    });

    readonly createBalanceAdjustment = Effect.fn('TransactionService.createBalanceAdjustment')(function* (
        accountId: number,
        delta: number,
        operatedAt: Date
    ) {
        const isIncome = isPositiveNumber(delta);
        const amount = Math.abs(delta);
        const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({ accountId, amount, operatedAt, externalSource: null });

        const transaction = yield* transactionRepository.create({
            type: TransactionTypeEnum.ADJUSTMENT,
            title: '',
            comment: '',
            externalId: null,
            externalSource: null,
            operatedAt,
            exchangeRate: valuation.baseExchangeRate ?? 1,
            fromAccountId: isIncome ? null : accountId,
            toAccountId: isIncome ? accountId : null,
            updatedBy: null
        });

        yield* transactionEntryRepository.create({
            accountId,
            transactionId: transaction.id,
            categoryId: null,
            mccCategoryId: null,
            amount,
            type: isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
            exchangeRate: valuation.baseExchangeRate ?? 1,
            baseInstrumentId: valuation.baseInstrumentId,
            baseExchangeRate: valuation.baseExchangeRate,
            baseAmount: valuation.baseAmount
        });

        return transaction.id;
    });

    readonly moveExternalEntryToAccount = Effect.fn('TransactionService.moveExternalEntryToAccount')(
        function* (transactionId: number, externalId: string, accountId: number, isIncome: boolean) {
            const existingEntry = yield* transactionEntryRepository.findByTransactionIdAndExternalId(transactionId, externalId);
            if (!isDefined(existingEntry) || existingEntry.accountId === accountId) {
                return false;
            }

            yield* transactionEntryRepository.updateById(existingEntry.id, { accountId });
            yield* transactionRepository.updateById(
                existingEntry.originalTransactionId ?? existingEntry.transactionId,
                isIncome ? { toAccountId: accountId } : { fromAccountId: accountId }
            );
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([existingEntry.accountId, accountId]);

            return true;
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly getEarliestTransactionTimeByAccountId = Effect.fn('TransactionService.getEarliestTransactionTimeByAccountId')(function* (
        accountId: number
    ) {
        return yield* transactionRepository.getTransactionTimeByAccountId(accountId, 'earliest');
    });

    readonly getEarliestTransactionTimeByExternalSource = Effect.fn('TransactionService.getEarliestTransactionTimeByExternalSource')(
        function* (externalSource: ExternalSourceEnum) {
            return yield* transactionRepository.getEarliestTransactionTimeByExternalSource(externalSource);
        }
    );

    readonly updateAllBalances = Effect.fn('TransactionService.updateAllBalances')(function* () {
        yield* accountBalanceIncrementalService.updateAllBalances(true);
    });

    readonly createInternal = Effect.fn('TransactionService.createInternal')(
        function* (this: TransactionService, input: TransactionCreateInputInterface) {
            const [transaction] = yield* this.bulkCreate([input]);

            return transaction;
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly createInternalTransfer = Effect.fn('TransactionService.createInternalTransfer')(
        function* (this: TransactionService, input: TransactionCreateInputInterface) {
            const { fromEntry, toEntry } = yield* this.findPrimaryEntries(input.entries, input.fromAccountId, input.toAccountId);
            const [fromAccount, toAccount] = yield* Effect.all(
                [this.findAccountByIdOrFail(fromEntry.accountId), this.findAccountByIdOrFail(toEntry.accountId)],
                { concurrency: 'unbounded' }
            );
            const fromAmountInMicroUnits = convertToMicroUnits(fromEntry.amount);
            const { amount: toAmount, exchangeRate } = yield* this.getTransferAmountAndExchangeRate(
                input,
                fromAccount,
                toAccount,
                fromAmountInMicroUnits
            );
            yield* assertTransferAccountsAreNotDebt([fromAccount, toAccount]);

            const transaction = yield* transactionRepository.create({ ...input, exchangeRate, externalId: null, externalSource: null });

            yield* this.createTransferEntries(transaction, input, { fromEntry, toEntry, fromAmountInMicroUnits, toAmount });
            yield* this.finalizeInternalTransfer(input, transaction.id);

            return transaction;
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly updateById = Effect.fn('TransactionService.updateById')(
        function* (this: TransactionService, id: number, input: TransactionUpdateServiceInputInterface) {
            const existingTransaction = yield* transactionRepository.getByIdWithEntries(id);
            yield* transactionDepositSafetyService.assertNoDepositExpenseInputs([
                {
                    entries: input.entries,
                    fromAccountId: input.fromAccountId ?? existingTransaction?.fromAccountId ?? null,
                    type: input.type ?? existingTransaction?.type ?? TransactionTypeEnum.EXPENSE
                }
            ]);

            const isConsolidated = isDefined(existingTransaction?.consolidationType);
            const transaction = yield* transactionRepository.updateById(id, {
                title: input.title,
                comment: input.comment,
                type: input.type,
                operatedAt: input.operatedAt,
                fromAccountId: input.fromAccountId,
                toAccountId: input.toAccountId,
                exchangeRate: input.exchangeRate,
                updatedBy: TransactionUpdatedByEnum.USER
            });

            yield* upsertTransactionEntriesAndTags({ transactionId: id, input, operatedAt: transaction.operatedAt, isConsolidated });
            yield* transactionDebtSettlementService.resyncInTransaction(id);

            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([
                ...this.getAccountIdsFromTransactions(isDefined(existingTransaction) ? [existingTransaction] : []),
                ...this.getAccountIdsFromInputs([input])
            ]);

            return transaction;
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    private readonly persistSyncedTransfer = Effect.fnUntraced(function* (
        this: TransactionService,
        input: TransactionCreateInputInterface
    ) {
        const { fromEntry, toEntry } = yield* this.findPrimaryEntries(input.entries, input.fromAccountId, input.toAccountId);
        const transaction = yield* transactionRepository.create({ ...input, exchangeRate: 1 });
        yield* this.persistPrimaryTransfer(
            transaction,
            input,
            fromEntry,
            toEntry,
            convertToMicroUnits(fromEntry.amount),
            convertToMicroUnits(toEntry.amount)
        );

        return transaction;
    });

    // eslint-disable-next-line @typescript-eslint/max-params -- Transfer persistence keeps positional arguments instead of a single-consumer param-bag interface
    private readonly persistPrimaryTransfer = Effect.fnUntraced(function* (
        this: TransactionService,
        transaction: TransactionEntityInterface,
        input: TransactionCreateInputInterface,
        fromEntry: TransactionEntryCreateInputInterface,
        toEntry: TransactionEntryCreateInputInterface,
        fromAmountInMicroUnits: number,
        toAmountInMicroUnits: number
    ) {
        const additionalEntryValuations = yield* entryBaseValuationService.valueEntries(input.entries, input.operatedAt);
        const [fromValuation, toValuation] = yield* Effect.all(
            [
                this.valueTransferLeg(fromEntry.accountId, fromAmountInMicroUnits, input),
                this.valueTransferLeg(toEntry.accountId, toAmountInMicroUnits, input)
            ],
            { concurrency: 'unbounded' }
        );

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

        yield* this.persistTransfer(transaction, input, primaryEntries, fromEntry, toEntry, additionalEntryValuations);
    });

    private readonly valueTransferLeg = Effect.fnUntraced(function* (
        accountId: number,
        amount: number,
        input: TransactionCreateInputInterface
    ) {
        return yield* entryBaseValuationService.valueMicroUnitEntry({
            accountId,
            amount,
            operatedAt: input.operatedAt,
            externalSource: input.externalSource
        });
    });

    // eslint-disable-next-line @typescript-eslint/max-params -- Transfer persistence keeps positional arguments instead of a single-consumer param-bag interface
    private readonly persistTransfer = Effect.fnUntraced(function* (
        transaction: TransactionEntityInterface,
        input: TransactionCreateInputInterface,
        primaryEntries: readonly TransactionEntryCreateEntityInterface[],
        fromEntry: TransactionEntryCreateInputInterface,
        toEntry: TransactionEntryCreateInputInterface,
        additionalEntryValuations: Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>
    ) {
        yield* transactionEntryRepository.bulkCreate([
            ...primaryEntries,
            ...buildAdditionalTransferEntries({
                entries: input.entries,
                fromEntry,
                toEntry,
                transactionId: transaction.id,
                valuations: additionalEntryValuations
            })
        ]);

        if (isNotEmptyArray(input.tagIds)) {
            yield* transactionTagsRepository.bulkCreate(transactionMapTagIdsToCreateEntities(input.tagIds, transaction.id));
        }
    });

    private readonly findAccountByIdOrFail = Effect.fnUntraced(function* (id: number) {
        const account = yield* Db.query(db => accountRepository.findById(id, db));

        if (!isDefined(account)) {
            return yield* Effect.die(new Error(i18n._({ id: 'transaction.accountNotFound', message: 'Account not found' })));
        }

        return account;
    });

    private readonly getTransferAmountAndExchangeRate = Effect.fnUntraced(function* (
        input: TransactionCreateInputInterface,
        fromAccount: AccountEntityInterface,
        toAccount: AccountEntityInterface,
        fromAmountInMicroUnits: number
    ) {
        const hasCustomExchangeRate = isPositiveNumber(input.exchangeRate) && input.exchangeRate !== 1;
        const { amount, exchangeRate } = yield* exchangeRatesService.convert(
            fromAccount.instrumentId,
            toAccount.instrumentId,
            fromAmountInMicroUnits
        );

        return {
            amount: hasCustomExchangeRate ? Math.round(fromAmountInMicroUnits / input.exchangeRate) : amount,
            exchangeRate: hasCustomExchangeRate ? input.exchangeRate : exchangeRate
        };
    });

    private readonly createTransferEntries = Effect.fnUntraced(function* (
        transaction: TransactionEntityInterface,
        input: TransactionCreateInputInterface,
        primaryEntryInput: {
            readonly fromEntry: TransactionEntryCreateInputInterface;
            readonly toEntry: TransactionEntryCreateInputInterface;
            readonly fromAmountInMicroUnits: number;
            readonly toAmount: number;
        }
    ) {
        const additionalEntryValuations = yield* entryBaseValuationService.valueEntries(input.entries, input.operatedAt);
        const [fromValuation, toValuation] = yield* Effect.all(
            [
                entryBaseValuationService.valueMicroUnitEntry({
                    accountId: primaryEntryInput.fromEntry.accountId,
                    amount: primaryEntryInput.fromAmountInMicroUnits,
                    operatedAt: input.operatedAt,
                    externalSource: input.externalSource
                }),
                entryBaseValuationService.valueMicroUnitEntry({
                    accountId: primaryEntryInput.toEntry.accountId,
                    amount: primaryEntryInput.toAmount,
                    operatedAt: input.operatedAt,
                    externalSource: input.externalSource
                })
            ],
            { concurrency: 'unbounded' }
        );
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

        return yield* transactionEntryRepository.bulkCreate([
            ...primaryEntries,
            ...buildAdditionalTransferEntries({
                entries: input.entries,
                fromEntry: primaryEntryInput.fromEntry,
                toEntry: primaryEntryInput.toEntry,
                transactionId: transaction.id,
                valuations: additionalEntryValuations
            })
        ]);
    });

    private readonly finalizeInternalTransfer = Effect.fnUntraced(function* (
        this: TransactionService,
        input: TransactionCreateInputInterface,
        transactionId: number
    ) {
        if (isNotEmptyArray(input.tagIds)) {
            yield* transactionTagsRepository.bulkCreate(transactionMapTagIdsToCreateEntities(input.tagIds, transactionId));
        }

        yield* accountBalanceIncrementalService.updateBalancesByAccountIds(this.getAccountIdsFromInputs([input]));
    });

    private readonly findPrimaryEntries = Effect.fnUntraced(function* (
        entries: TransactionEntryCreateInputInterface[],
        fromAccountId: number | null,
        toAccountId: number | null
    ) {
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
            return yield* Effect.die(new Error('Transfer must have exactly two entries'));
        }

        return { fromEntry, toEntry };
    });

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

    private getAccountIdsFromInputs(inputs: readonly Pick<TransactionCreateInputInterface, 'entries'>[]): number[] {
        return [...new Set(inputs.flatMap(input => input.entries.map(entry => entry.accountId)))];
    }

    private getAccountIdsFromTransactions(transactions: readonly TransactionWithEntriesEntityInterface[]): number[] {
        return [...new Set(transactions.flatMap(transaction => transaction.entries.map(entry => entry.accountId)))];
    }
}

export const transactionService = new TransactionService();
