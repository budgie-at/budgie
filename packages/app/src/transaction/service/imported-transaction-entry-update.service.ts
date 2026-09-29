import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { transactionMapEntryInputToCreateEntity } from '../utils/transaction-map-entry-input-to-create-entity.util';

import { transactionDepositSafetyService } from './transaction-deposit-safety.service';

import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type { ImportedEntryUpdateContextInterface } from '../interface/imported-entry-update-context.interface';
import type {
    DB,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryEntityInterface,
    TransactionEntryUpdateInputInterface
} from '@budgie/contracts';

class ImportedTransactionEntryUpdateService {
    @Log(
        (transactionId, externalId) => `enter transactionId=${transactionId} externalId=${externalId}`,
        (result, transactionId, externalId) => `done result=${String(result)} transactionId=${transactionId} externalId=${externalId}`,
        (error, transactionId, externalId) =>
            `throw transactionId=${transactionId} externalId=${externalId} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async updateExternalEntryQuote(
        transactionId: number,
        externalId: string,
        quote: Required<Pick<TransactionEntryCreateInputInterface, 'quotedInstrumentId' | 'quotedAmount' | 'quotedUnitPrice'>>
    ): Promise<boolean> {
        return transactionAsync(db, async tx => {
            const existingEntry = await transactionEntryRepository.findByTransactionIdAndExternalId(transactionId, externalId, tx);
            if (
                !isDefined(existingEntry) ||
                (existingEntry.quotedInstrumentId === quote.quotedInstrumentId &&
                    existingEntry.quotedAmount === quote.quotedAmount &&
                    existingEntry.quotedUnitPrice === quote.quotedUnitPrice)
            ) {
                return false;
            }

            await transactionEntryRepository.updateById(existingEntry.id, quote, tx);

            return true;
        });
    }

    @Log(
        (inputs, tx) => `enter transactionCount=${inputs.length} hasTx=${String(isDefined(tx))}`,
        (_result, inputs, tx) => `done transactionCount=${inputs.length} hasTx=${String(isDefined(tx))}`,
        (error, inputs, tx) => `throw transactionCount=${inputs.length} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async bulkUpdate(inputs: readonly TransactionCreateInputInterface[], tx: DB): Promise<void> {
        const existingEntries = await this.findExistingEntries(inputs, tx);

        await transactionDepositSafetyService.assertNoDepositExpenseImportedEntries(
            inputs
                .flatMap(input => input.entries.map(entry => this.findExistingEntry(existingEntries, entry.accountId, entry.externalId)))
                .filter(isDefined),
            tx
        );

        const valuationMaps = await entryBaseValuationService.valueTransactionsEntries(
            inputs.map(input => ({
                operatedAt: input.operatedAt,
                entries: input.entries.filter(entry => this.needsValuation(entry, input, existingEntries))
            })),
            tx
        );
        const context: ImportedEntryUpdateContextInterface = {
            existingEntries,
            valuations: new Map(valuationMaps.flatMap(valuationMap => [...valuationMap])),
            tx
        };

        await inputs
            .flatMap(input => input.entries.map(entry => ({ entry, input })))
            .reduce(
                (previousEntryPromise, { entry, input }) => previousEntryPromise.then(() => this.updateEntry(entry, input, context)),
                Promise.resolve()
            );
    }

    private async findExistingEntries(
        inputs: readonly TransactionCreateInputInterface[],
        tx: DB
    ): Promise<Map<string, TransactionEntryEntityInterface>> {
        const externalIdsByAccountId = inputs.reduce((result, input) => {
            input.entries.forEach(entry => {
                const accountExternalIds = result.get(entry.accountId) ?? new Set<string>();

                [entry.externalId, input.externalId].filter(isDefined).forEach(externalId => accountExternalIds.add(externalId));
                result.set(entry.accountId, accountExternalIds);
            });

            return result;
        }, new Map<number, Set<string>>());

        const accountEntries = await Promise.all(
            [...externalIdsByAccountId].map(([accountId, externalIds]) =>
                transactionEntryRepository.findByExternalIdsAndAccountId([...externalIds], accountId, tx)
            )
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
    }

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

    private async resolveValuation(
        entry: TransactionEntryCreateInputInterface,
        input: TransactionCreateInputInterface,
        context: ImportedEntryUpdateContextInterface
    ): Promise<EntryBaseValuationInterface> {
        return (
            context.valuations.get(entry) ??
            (await entryBaseValuationService.valueMicroUnitEntry({
                accountId: entry.accountId,
                amount: convertToMicroUnits(entry.amount),
                operatedAt: input.operatedAt,
                externalSource: input.externalSource,
                tx: context.tx
            }))
        );
    }

    private async updateEntry(
        entry: TransactionEntryCreateInputInterface,
        input: TransactionCreateInputInterface,
        context: ImportedEntryUpdateContextInterface
    ): Promise<void> {
        if (!isDefined(entry.externalId)) {
            return;
        }

        const existingEntry = this.findExistingEntry(context.existingEntries, entry.accountId, entry.externalId);

        if (!isDefined(existingEntry)) {
            return this.createMissingEntry(entry, input, context);
        }

        const nextAmount = convertToMicroUnits(entry.amount);
        const nextBaseValuation = await this.resolveValuation(entry, input, context);
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

        await this.applyEntryUpdate(
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
    }

    private async applyEntryUpdate(
        existingEntry: TransactionEntryEntityInterface,
        input: TransactionCreateInputInterface,
        update: TransactionEntryUpdateInputInterface,
        context: ImportedEntryUpdateContextInterface
    ): Promise<void> {
        if (!isDefined(existingEntry.externalId)) {
            return;
        }

        const updatedEntry = await transactionEntryRepository.updateByExternalIdAndAccountId(
            existingEntry.externalId,
            existingEntry.accountId,
            update,
            context.tx
        );

        if (isDefined(updatedEntry)) {
            context.existingEntries.set(
                ImportedTransactionEntryUpdateService.buildEntryKey(existingEntry.accountId, existingEntry.externalId),
                updatedEntry
            );
        }

        await transactionRepository.updateById(
            existingEntry.originalTransactionId ?? existingEntry.transactionId,
            {
                title: input.title,
                comment: input.comment,
                operatedAt: input.operatedAt
            },
            context.tx
        );
    }

    private async createMissingEntry(
        entry: TransactionEntryCreateInputInterface,
        input: TransactionCreateInputInterface,
        context: ImportedEntryUpdateContextInterface
    ): Promise<void> {
        const primaryEntry = this.findExistingEntry(context.existingEntries, entry.accountId, input.externalId);

        if (!isDefined(primaryEntry) || !isDefined(entry.externalId)) {
            return;
        }

        const createdEntry = await transactionEntryRepository.create(
            {
                ...transactionMapEntryInputToCreateEntity(
                    entry,
                    primaryEntry.transactionId,
                    await this.resolveValuation(entry, input, context)
                ),
                originalTransactionId: primaryEntry.originalTransactionId
            },
            context.tx
        );

        context.existingEntries.set(ImportedTransactionEntryUpdateService.buildEntryKey(entry.accountId, entry.externalId), createdEntry);
    }

    private static buildEntryKey(accountId: number, externalId: string): string {
        return `${accountId}:${externalId}`;
    }
}

export const importedTransactionEntryUpdateService = new ImportedTransactionEntryUpdateService();
