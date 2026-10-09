import { Db, TransactionEntryRepository, TransactionRepository } from '@budgie/contracts';
import { EntryBaseValuationService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micro-units.util';
import { transactionMapEntryInputToCreateEntity } from '../util/transaction-map-entry-input-to-create-entity.util';
import { transactionResolveImportedOperationMetadata } from '../util/transaction-resolve-imported-operation-metadata.util';

import { TransactionDepositSafetyService } from './transaction-deposit-safety.service';

import type { ImportedEntryUpdateContextInterface } from '../interface/imported-entry-update-context.interface';
import type {
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryEntityInterface,
    TransactionEntryUpdateInputInterface
} from '@budgie/contracts';

export class ImportedTransactionEntryUpdateService extends Context.Service<ImportedTransactionEntryUpdateService>()(
    '@budgie/ledger/ImportedTransactionEntryUpdateService',
    {
        make: Effect.gen(function* () {
            const transactionEntryRepository = yield* TransactionEntryRepository;
            const transactionRepository = yield* TransactionRepository;
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const transactionDepositSafetyService = yield* TransactionDepositSafetyService;

            const buildEntryKey = (accountId: number, externalId: string): string => `${accountId}:${externalId}`;

            const findExistingEntry = (
                existingEntries: Map<string, TransactionEntryEntityInterface>,
                accountId: number,
                externalId: string | null | undefined
            ): TransactionEntryEntityInterface | null => {
                if (!isDefined(externalId)) {
                    return null;
                }

                return existingEntries.get(buildEntryKey(accountId, externalId)) ?? null;
            };

            const needsValuation = (
                entry: TransactionEntryCreateInputInterface,
                input: TransactionCreateInputInterface,
                existingEntries: Map<string, TransactionEntryEntityInterface>
            ): boolean => {
                if (!isDefined(entry.externalId)) {
                    return false;
                }

                return (
                    isDefined(findExistingEntry(existingEntries, entry.accountId, entry.externalId)) ||
                    isDefined(findExistingEntry(existingEntries, entry.accountId, input.externalId))
                );
            };

            const findExistingEntries = Effect.fnUntraced(function* (inputs: readonly TransactionCreateInputInterface[]) {
                const externalIdsByAccountId = inputs.reduce((result, input) => {
                    input.entries.forEach(entry => {
                        const accountExternalIds = result.get(entry.accountId) ?? new Set<string>();

                        [entry.externalId, input.externalId].filter(isDefined).forEach(externalId => accountExternalIds.add(externalId));
                        result.set(entry.accountId, accountExternalIds);
                    });

                    return result;
                }, new Map<number, Set<string>>());

                const accountEntries = yield* Effect.forEach(
                    [...externalIdsByAccountId],
                    ([accountId, externalIds]) => transactionEntryRepository.findByExternalIdsAndAccountId([...externalIds], accountId),
                    { concurrency: 'unbounded' }
                );

                return accountEntries.flat().reduce((result, entry) => {
                    if (isDefined(entry.externalId)) {
                        const key = buildEntryKey(entry.accountId, entry.externalId);

                        if (!result.has(key)) {
                            result.set(key, entry);
                        }
                    }

                    return result;
                }, new Map<string, TransactionEntryEntityInterface>());
            });

            const resolveValuation = Effect.fnUntraced(function* (
                entry: TransactionEntryCreateInputInterface,
                input: TransactionCreateInputInterface,
                context: ImportedEntryUpdateContextInterface
            ) {
                return (
                    context.valuations.get(entry) ??
                    (yield* entryBaseValuationService.valueMicroUnitEntry({
                        accountId: entry.accountId,
                        amount: convertToMicroUnits(entry.amount),
                        operatedAt: input.operatedAt
                    }))
                );
            });

            const applyEntryUpdate = Effect.fnUntraced(function* (
                existingEntry: TransactionEntryEntityInterface,
                input: TransactionCreateInputInterface,
                update: TransactionEntryUpdateInputInterface,
                context: ImportedEntryUpdateContextInterface
            ) {
                if (!isDefined(existingEntry.externalId)) {
                    return;
                }

                const updatedEntry = yield* transactionEntryRepository.updateByExternalIdAndAccountId(
                    existingEntry.externalId,
                    existingEntry.accountId,
                    update
                );

                if (isDefined(updatedEntry)) {
                    context.existingEntries.set(buildEntryKey(existingEntry.accountId, existingEntry.externalId), updatedEntry);
                }

                yield* transactionRepository.updateById(existingEntry.originalTransactionId ?? existingEntry.transactionId, {
                    title: input.title,
                    comment: input.comment,
                    operatedAt: input.operatedAt
                });
            });

            const createMissingEntry = Effect.fnUntraced(function* (
                entry: TransactionEntryCreateInputInterface,
                input: TransactionCreateInputInterface,
                context: ImportedEntryUpdateContextInterface
            ) {
                const primaryEntry = findExistingEntry(context.existingEntries, entry.accountId, input.externalId);

                if (!isDefined(primaryEntry) || !isDefined(entry.externalId)) {
                    return;
                }

                const createdEntry = yield* transactionEntryRepository.create({
                    ...transactionMapEntryInputToCreateEntity(
                        entry,
                        primaryEntry.transactionId,
                        yield* resolveValuation(entry, input, context)
                    ),
                    originalTransactionId: primaryEntry.originalTransactionId
                });

                context.existingEntries.set(buildEntryKey(entry.accountId, entry.externalId), createdEntry);
            });

            const updateEntry = Effect.fnUntraced(function* (
                entry: TransactionEntryCreateInputInterface,
                input: TransactionCreateInputInterface,
                context: ImportedEntryUpdateContextInterface
            ) {
                if (!isDefined(entry.externalId)) {
                    return;
                }

                const existingEntry = findExistingEntry(context.existingEntries, entry.accountId, entry.externalId);

                if (!isDefined(existingEntry)) {
                    yield* createMissingEntry(entry, input, context);

                    return;
                }

                const nextAmount = convertToMicroUnits(entry.amount);
                const nextBaseValuation = yield* resolveValuation(entry, input, context);
                const nextMccCategoryId = entry.mccCategoryId ?? existingEntry.mccCategoryId;
                const { operationInstrumentId: nextOperationInstrumentId, operationAmount: nextOperationAmount } =
                    transactionResolveImportedOperationMetadata(existingEntry, entry);

                if (
                    existingEntry.amount === nextAmount &&
                    existingEntry.mccCategoryId === nextMccCategoryId &&
                    existingEntry.exchangeRate === entry.exchangeRate &&
                    existingEntry.baseInstrumentId === nextBaseValuation.baseInstrumentId &&
                    existingEntry.baseExchangeRate === nextBaseValuation.baseExchangeRate &&
                    existingEntry.baseAmount === nextBaseValuation.baseAmount &&
                    existingEntry.toIban === entry.toIban &&
                    existingEntry.operationInstrumentId === nextOperationInstrumentId &&
                    existingEntry.operationAmount === nextOperationAmount
                ) {
                    return;
                }

                yield* applyEntryUpdate(
                    existingEntry,
                    input,
                    {
                        amount: nextAmount,
                        exchangeRate: entry.exchangeRate,
                        ...nextBaseValuation,
                        toIban: entry.toIban,
                        mccCategoryId: nextMccCategoryId,
                        operationInstrumentId: nextOperationInstrumentId,
                        operationAmount: nextOperationAmount
                    },
                    context
                );
            });

            return {
                updateExternalEntryQuote: Effect.fn('ImportedTransactionEntryUpdateService.updateExternalEntryQuote')(
                    function* (
                        transactionId: number,
                        externalId: string,
                        quote: Required<
                            Pick<TransactionEntryCreateInputInterface, 'quotedInstrumentId' | 'quotedAmount' | 'quotedUnitPrice'>
                        >
                    ) {
                        const existingEntry = yield* transactionEntryRepository.findByTransactionIdAndExternalId(transactionId, externalId);

                        if (
                            !isDefined(existingEntry) ||
                            (existingEntry.quotedInstrumentId === quote.quotedInstrumentId &&
                                existingEntry.quotedAmount === quote.quotedAmount &&
                                existingEntry.quotedUnitPrice === quote.quotedUnitPrice)
                        ) {
                            return false;
                        }

                        yield* transactionEntryRepository.updateById(existingEntry.id, quote);

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                bulkUpdate: Effect.fn('ImportedTransactionEntryUpdateService.bulkUpdate')(function* (
                    inputs: readonly TransactionCreateInputInterface[]
                ) {
                    const existingEntries = yield* findExistingEntries(inputs);

                    yield* transactionDepositSafetyService.assertNoDepositExpenseImportedEntries(
                        inputs
                            .flatMap(input =>
                                input.entries.map(entry => findExistingEntry(existingEntries, entry.accountId, entry.externalId))
                            )
                            .filter(isDefined)
                    );

                    const valuationMaps = yield* entryBaseValuationService.valueTransactionsEntries(
                        inputs.map(input => ({
                            operatedAt: input.operatedAt,
                            entries: input.entries.filter(entry => needsValuation(entry, input, existingEntries))
                        }))
                    );
                    const context: ImportedEntryUpdateContextInterface = {
                        existingEntries,
                        valuations: new Map(valuationMaps.flatMap(valuationMap => [...valuationMap]))
                    };

                    yield* Effect.forEach(
                        inputs.flatMap(input => input.entries.map(entry => ({ entry, input }))),
                        ({ entry, input }) => updateEntry(entry, input, context),
                        { discard: true }
                    );
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(ImportedTransactionEntryUpdateService, ImportedTransactionEntryUpdateService.make).pipe(
        Layer.provide([
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            EntryBaseValuationService.layer,
            TransactionDepositSafetyService.layer
        ])
    );
}
