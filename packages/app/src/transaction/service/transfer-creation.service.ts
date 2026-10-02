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
    TransactionTagsRepository
} from '@budgie/contracts';
import { EntryBaseValuationService, ExchangeRatesService } from '@budgie/market';
import { i18n } from '@lingui/core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { assertTransferAccountsAreNotDebt } from '../utils/assert-transfer-accounts-are-not-debt.util';
import { buildAdditionalTransferEntries } from '../utils/build-additional-transfer-entries.util';
import { getEntryAccountIds } from '../utils/get-entry-account-ids.util';
import { transactionMapTagIdsToCreateEntities } from '../utils/transaction-map-tag-ids-to-create-entities.util';

import type { EntryBaseValuationInterface } from '@budgie/market';

export class TransferCreationService extends Context.Service<TransferCreationService>()('@budgie/app/TransferCreationService', {
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
            toIban: entry.toIban ?? null
        });

        const valueTransferLeg = Effect.fnUntraced(function* (accountId: number, amount: number, input: TransactionCreateInputInterface) {
            return yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId,
                amount,
                operatedAt: input.operatedAt
            });
        });

        // eslint-disable-next-line @typescript-eslint/max-params -- Transfer persistence keeps positional arguments instead of a single-consumer param-bag interface
        const persistTransfer = Effect.fnUntraced(function* (
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

        // eslint-disable-next-line @typescript-eslint/max-params -- Transfer persistence keeps positional arguments instead of a single-consumer param-bag interface
        const persistPrimaryTransfer = Effect.fnUntraced(function* (
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
                    valueTransferLeg(fromEntry.accountId, fromAmountInMicroUnits, input),
                    valueTransferLeg(toEntry.accountId, toAmountInMicroUnits, input)
                ],
                { concurrency: 'unbounded' }
            );

            const primaryEntries = [
                buildPrimaryTransferEntry(
                    transaction.id,
                    fromEntry,
                    TransactionEntryTypeEnum.CREDIT,
                    fromAmountInMicroUnits,
                    fromValuation
                ),
                buildPrimaryTransferEntry(transaction.id, toEntry, TransactionEntryTypeEnum.DEBIT, toAmountInMicroUnits, toValuation)
            ];

            yield* persistTransfer(transaction, input, primaryEntries, fromEntry, toEntry, additionalEntryValuations);
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
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
                return yield* Effect.die(new Error('Transfer must have exactly two entries'));
            }

            return { fromEntry, toEntry };
        });

        const persistSyncedTransfer = Effect.fnUntraced(function* (input: TransactionCreateInputInterface) {
            const { fromEntry, toEntry } = yield* findPrimaryEntries(input.entries, input.fromAccountId, input.toAccountId);
            const transaction = yield* transactionRepository.create({ ...input, exchangeRate: 1 });
            yield* persistPrimaryTransfer(
                transaction,
                input,
                fromEntry,
                toEntry,
                convertToMicroUnits(fromEntry.amount),
                convertToMicroUnits(toEntry.amount)
            );

            return transaction;
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
                    if (inputs.some(input => input.exchangeRate !== 1)) {
                        // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal invariant
                        return yield* Effect.die(new Error('Synced transfer exchange rate must be equal to 1'));
                    }

                    const transactions: TransactionEntityInterface[] = [];
                    for (const input of inputs) {
                        transactions.push(yield* persistSyncedTransfer(input));
                    }

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

                    yield* persistPrimaryTransfer(transaction, input, fromEntry, toEntry, fromAmountInMicroUnits, toAmount);
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
