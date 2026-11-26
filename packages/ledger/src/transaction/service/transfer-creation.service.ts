import {
    AccountRepository,
    type AccountEntityInterface,
    Db,
    type TransactionCreateInputInterface,
    type TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    type TransactionEntryCreateInputInterface,
    TransactionEntryKindEnum,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTagsRepository,
    convertToMicroUnits
} from '@budgie/contracts';
import { EntryBaseValuationService, ExchangeRatesService } from '@budgie/market';
import { i18n } from '@lingui/core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { assertTransferAccountsAreNotDebt } from '../utils/assert-transfer-accounts-are-not-debt.util';
import { buildAdditionalTransferEntries } from '../utils/build-additional-transfer-entries.util';
import { getEntryAccountIds } from '../utils/get-entry-account-ids.util';
import { resolveBankTransactionSyncIds } from '../utils/resolve-bank-transaction-sync-ids.util';
import { transactionMapTagIdsToCreateEntities } from '../utils/transaction-map-tag-ids-to-create-entities.util';

import type { EntryBaseValuationInterface } from '@budgie/market';

export class TransferCreationService extends Context.Service<TransferCreationService>()('@budgie/ledger/TransferCreationService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionTagsRepository = yield* TransactionTagsRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const exchangeRatesService = yield* ExchangeRatesService;
        const entryBaseValuationService = yield* EntryBaseValuationService;

        // eslint-disable-next-line @typescript-eslint/max-params -- Entry construction keeps positional arguments instead of a single-consumer param-bag interface
        const buildPrimaryTransferEntry = (
            transactionId: number,
            entry: TransactionEntryCreateInputInterface,
            type: TransactionEntryTypeEnum,
            amount: number,
            valuation: EntryBaseValuationInterface
        ): TransactionEntryCreateEntityInterface => ({
            transactionId,
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
            quotedInstrumentId: entry.quotedInstrumentId ?? null,
            quotedUnitPrice: entry.quotedUnitPrice ?? null,
            toIban: entry.toIban ?? null
        });

        const valueTransferLeg = Effect.fnUntraced(function* (
            accountId: number,
            amount: number,
            input: TransactionCreateInputInterface,
            valuation?: EntryBaseValuationInterface
        ) {
            if (isDefined(valuation)) {
                return valuation;
            }

            return yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId,
                amount,
                operatedAt: input.operatedAt
            });
        });

        // eslint-disable-next-line @typescript-eslint/max-params -- Transfer persistence keeps positional arguments instead of a single-consumer param-bag interface
        const buildPrimaryTransferEntries = Effect.fnUntraced(function* (
            transaction: TransactionEntityInterface,
            input: TransactionCreateInputInterface,
            fromEntry: TransactionEntryCreateInputInterface,
            toEntry: TransactionEntryCreateInputInterface,
            fromAmountInMicroUnits: number,
            toAmountInMicroUnits: number,
            entryValuations?: Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>
        ) {
            const additionalEntryValuations =
                entryValuations ?? (yield* entryBaseValuationService.valueEntries(input.entries, input.operatedAt));
            const [fromValuation, toValuation] = yield* Effect.all(
                [
                    valueTransferLeg(fromEntry.accountId, fromAmountInMicroUnits, input, entryValuations?.get(fromEntry)),
                    valueTransferLeg(toEntry.accountId, toAmountInMicroUnits, input, entryValuations?.get(toEntry))
                ],
                { concurrency: 'unbounded' }
            );

            return [
                buildPrimaryTransferEntry(
                    transaction.id,
                    fromEntry,
                    TransactionEntryTypeEnum.CREDIT,
                    fromAmountInMicroUnits,
                    fromValuation
                ),
                buildPrimaryTransferEntry(transaction.id, toEntry, TransactionEntryTypeEnum.DEBIT, toAmountInMicroUnits, toValuation),
                ...buildAdditionalTransferEntries({
                    entries: input.entries,
                    fromEntry,
                    toEntry,
                    transactionId: transaction.id,
                    valuations: additionalEntryValuations
                })
            ];
        });

        const findPrimaryEntries = Effect.fnUntraced(function* (
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
                return yield* Effect.die(new Error('Transfer must have exactly two entries'));
            }

            return { fromEntry, toEntry };
        });

        const findAccountByIdOrFail = Effect.fnUntraced(function* (id: number) {
            const account = yield* accountRepository.findById(id);

            if (!isDefined(account)) {
                return yield* Effect.die(new Error(i18n._({ id: 'transaction.accountNotFound', message: 'Account not found' })));
            }

            return account;
        });

        const getTransferAmountAndExchangeRate = Effect.fnUntraced(function* (
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

        return {
            createSyncedTransfers: Effect.fn('TransferCreationService.createSyncedTransfers')(
                function* (inputs: TransactionCreateInputInterface[]) {
                    if (!isNotEmptyArray(inputs)) {
                        return [];
                    }

                    if (inputs.some(input => input.exchangeRate !== 1)) {
                        return yield* Effect.die(new Error('Synced transfer exchange rate must be equal to 1'));
                    }

                    const primaryLegs = yield* Effect.forEach(inputs, input =>
                        findPrimaryEntries(input.entries, input.fromAccountId, input.toAccountId)
                    );
                    const syncIds = yield* resolveBankTransactionSyncIds(inputs, accountRepository, transactionRepository);
                    const entryValuations = yield* entryBaseValuationService.valueTransactionsEntries(inputs);
                    const transactions = yield* transactionRepository.bulkCreate(
                        inputs.map((input, index) => {
                            const syncId = syncIds[index];

                            return {
                                ...input,
                                exchangeRate: 1,
                                ...(isDefined(syncId) && { syncId })
                            };
                        })
                    );
                    const batchEntries = (yield* Effect.forEach(transactions, (transaction, index) =>
                        buildPrimaryTransferEntries(
                            transaction,
                            inputs[index],
                            primaryLegs[index].fromEntry,
                            primaryLegs[index].toEntry,
                            convertToMicroUnits(primaryLegs[index].fromEntry.amount),
                            convertToMicroUnits(primaryLegs[index].toEntry.amount),
                            entryValuations[index]
                        )
                    )).flat();
                    const batchTags = transactions.flatMap((transaction, index) =>
                        transactionMapTagIdsToCreateEntities(inputs[index], transaction.id)
                    );

                    yield* transactionEntryRepository.bulkCreate(batchEntries);
                    yield* transactionTagsRepository.bulkCreate(batchTags);
                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds(getEntryAccountIds(inputs));

                    return transactions;
                },
                effect => Db.transaction(effect)
            ),
            createInternalTransfer: Effect.fn('TransferCreationService.createInternalTransfer')(
                function* (input: TransactionCreateInputInterface) {
                    const { fromEntry, toEntry } = yield* findPrimaryEntries(input.entries, input.fromAccountId, input.toAccountId);
                    const [fromAccount, toAccount] = yield* Effect.all(
                        [findAccountByIdOrFail(fromEntry.accountId), findAccountByIdOrFail(toEntry.accountId)],
                        { concurrency: 'unbounded' }
                    );
                    const fromAmountInMicroUnits = convertToMicroUnits(fromEntry.amount);
                    const { amount: toAmount, exchangeRate } = yield* getTransferAmountAndExchangeRate(
                        input,
                        fromAccount,
                        toAccount,
                        fromAmountInMicroUnits
                    );
                    yield* assertTransferAccountsAreNotDebt([fromAccount, toAccount]);

                    const transaction = yield* transactionRepository.create({
                        ...input,
                        exchangeRate,
                        externalId: null,
                        externalSource: null
                    });
                    const entries = yield* buildPrimaryTransferEntries(
                        transaction,
                        input,
                        fromEntry,
                        toEntry,
                        fromAmountInMicroUnits,
                        toAmount
                    );

                    yield* transactionEntryRepository.bulkCreate(entries);
                    yield* transactionTagsRepository.bulkCreate(transactionMapTagIdsToCreateEntities(input, transaction.id));
                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds(getEntryAccountIds([input]));

                    return transaction;
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(TransferCreationService, TransferCreationService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            TransactionTagsRepository.layer,
            AccountBalanceIncrementalService.layer,
            ExchangeRatesService.layer,
            EntryBaseValuationService.layer
        ])
    );
}
