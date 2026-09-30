import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { transactionMapEntryInputToCreateEntity } from '../utils/transaction-map-entry-input-to-create-entity.util';

import { transactionDepositSafetyService } from './transaction-deposit-safety.service';

import type { ImportedEntryUpdateContextInterface } from '../interface/imported-entry-update-context.interface';
import type {
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryEntityInterface,
    TransactionEntryUpdateInputInterface
} from '@budgie/contracts';

class ImportedTransactionEntryUpdateService {
    readonly updateExternalEntryQuote = Effect.fn('ImportedTransactionEntryUpdateService.updateExternalEntryQuote')(
        function* (
            transactionId: number,
            externalId: string,
            quote: Required<Pick<TransactionEntryCreateInputInterface, 'quotedInstrumentId' | 'quotedAmount' | 'quotedUnitPrice'>>
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
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly bulkUpdate = Effect.fn('ImportedTransactionEntryUpdateService.bulkUpdate')(function* (
        this: ImportedTransactionEntryUpdateService,
        inputs: readonly TransactionCreateInputInterface[]
    ) {
        const existingEntries = yield* this.findExistingEntries(inputs);

        yield* transactionDepositSafetyService.assertNoDepositExpenseImportedEntries(
            inputs
                .flatMap(input => input.entries.map(entry => this.findExistingEntry(existingEntries, entry.accountId, entry.externalId)))
                .filter(isDefined)
        );

        const valuationMaps = yield* entryBaseValuationService.valueTransactionsEntries(
            inputs.map(input => ({
                operatedAt: input.operatedAt,
                entries: input.entries.filter(entry => this.needsValuation(entry, input, existingEntries))
            }))
        );
        const context: ImportedEntryUpdateContextInterface = {
            existingEntries,
            valuations: new Map(valuationMaps.flatMap(valuationMap => [...valuationMap]))
        };

        yield* Effect.forEach(
            inputs.flatMap(input => input.entries.map(entry => ({ entry, input }))),
            ({ entry, input }) => this.updateEntry(entry, input, context),
            { discard: true }
        );
    });

    private readonly findExistingEntries = Effect.fnUntraced(function* (inputs: readonly TransactionCreateInputInterface[]) {
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
                const key = ImportedTransactionEntryUpdateService.buildEntryKey(entry.accountId, entry.externalId);

                if (!result.has(key)) {
                    result.set(key, entry);
                }
            }

            return result;
        }, new Map<string, TransactionEntryEntityInterface>());
    });

    private readonly resolveValuation = Effect.fnUntraced(function* (
        entry: TransactionEntryCreateInputInterface,
        input: TransactionCreateInputInterface,
        context: ImportedEntryUpdateContextInterface
    ) {
        return (
            context.valuations.get(entry) ??
            (yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: entry.accountId,
                amount: convertToMicroUnits(entry.amount),
                operatedAt: input.operatedAt,
                externalSource: input.externalSource
            }))
        );
    });

    private readonly updateEntry = Effect.fnUntraced(function* (
        this: ImportedTransactionEntryUpdateService,
        entry: TransactionEntryCreateInputInterface,
        input: TransactionCreateInputInterface,
        context: ImportedEntryUpdateContextInterface
    ) {
        if (!isDefined(entry.externalId)) {
            return;
        }

        const existingEntry = this.findExistingEntry(context.existingEntries, entry.accountId, entry.externalId);

        if (!isDefined(existingEntry)) {
            yield* this.createMissingEntry(entry, input, context);

            return;
        }

        const nextAmount = convertToMicroUnits(entry.amount);
        const nextBaseValuation = yield* this.resolveValuation(entry, input, context);
        const nextMccCategoryId = entry.mccCategoryId ?? existingEntry.mccCategoryId;

        if (
            existingEntry.amount === nextAmount &&
            existingEntry.mccCategoryId === nextMccCategoryId &&
            existingEntry.exchangeRate === entry.exchangeRate &&
            existingEntry.baseInstrumentId === nextBaseValuation.baseInstrumentId &&
            existingEntry.baseExchangeRate === nextBaseValuation.baseExchangeRate &&
            existingEntry.baseAmount === nextBaseValuation.baseAmount &&
            existingEntry.toIban === entry.toIban
        ) {
            return;
        }

        yield* this.applyEntryUpdate(
            existingEntry,
            input,
            {
                amount: nextAmount,
                exchangeRate: entry.exchangeRate,
                ...nextBaseValuation,
                toIban: entry.toIban,
                mccCategoryId: nextMccCategoryId
            },
            context
        );
    });

    // eslint-disable-next-line @typescript-eslint/max-params -- Entry update keeps positional arguments instead of a single-consumer param-bag interface
    private readonly applyEntryUpdate = Effect.fnUntraced(function* (
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
            context.existingEntries.set(
                ImportedTransactionEntryUpdateService.buildEntryKey(existingEntry.accountId, existingEntry.externalId),
                updatedEntry
            );
        }

        yield* transactionRepository.updateById(existingEntry.originalTransactionId ?? existingEntry.transactionId, {
            title: input.title,
            comment: input.comment,
            operatedAt: input.operatedAt
        });
    });

    private readonly createMissingEntry = Effect.fnUntraced(function* (
        this: ImportedTransactionEntryUpdateService,
        entry: TransactionEntryCreateInputInterface,
        input: TransactionCreateInputInterface,
        context: ImportedEntryUpdateContextInterface
    ) {
        const primaryEntry = this.findExistingEntry(context.existingEntries, entry.accountId, input.externalId);

        if (!isDefined(primaryEntry) || !isDefined(entry.externalId)) {
            return;
        }

        const createdEntry = yield* transactionEntryRepository.create({
            ...transactionMapEntryInputToCreateEntity(
                entry,
                primaryEntry.transactionId,
                yield* this.resolveValuation(entry, input, context)
            ),
            originalTransactionId: primaryEntry.originalTransactionId
        });

        context.existingEntries.set(ImportedTransactionEntryUpdateService.buildEntryKey(entry.accountId, entry.externalId), createdEntry);
    });

    private findExistingEntry(
        existingEntries: Map<string, TransactionEntryEntityInterface>,
        accountId: number,
        externalId: string | null | undefined
    ): TransactionEntryEntityInterface | null {
        if (!isDefined(externalId)) {
            return null;
        }

        return existingEntries.get(ImportedTransactionEntryUpdateService.buildEntryKey(accountId, externalId)) ?? null;
    }

    private needsValuation(
        entry: TransactionEntryCreateInputInterface,
        input: TransactionCreateInputInterface,
        existingEntries: Map<string, TransactionEntryEntityInterface>
    ): boolean {
        if (!isDefined(entry.externalId)) {
            return false;
        }

        return (
            isDefined(this.findExistingEntry(existingEntries, entry.accountId, entry.externalId)) ||
            isDefined(this.findExistingEntry(existingEntries, entry.accountId, input.externalId))
        );
    }

    private static buildEntryKey(accountId: number, externalId: string): string {
        return `${accountId}:${externalId}`;
    }
}

export const importedTransactionEntryUpdateService = new ImportedTransactionEntryUpdateService();
