import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { transactionMapEntryInputToCreateEntity } from '../utils/transaction-map-entry-input-to-create-entity.util';

import type { TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

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

    readonly update = Effect.fn('ImportedTransactionEntryUpdateService.update')(function* (
        this: ImportedTransactionEntryUpdateService,
        entries: readonly TransactionEntryCreateInputInterface[],
        input: TransactionCreateInputInterface
    ) {
        for (const entry of entries) {
            yield* this.updateEntry(entry, input);
        }
    });

    private readonly updateEntry = Effect.fnUntraced(function* (
        this: ImportedTransactionEntryUpdateService,
        entry: TransactionEntryCreateInputInterface,
        input: TransactionCreateInputInterface
    ) {
        if (!isDefined(entry.externalId)) {
            return;
        }

        const existingEntry = yield* transactionEntryRepository.findByExternalIdAndAccountId(entry.externalId, entry.accountId);

        if (!isDefined(existingEntry)) {
            yield* this.createMissingEntry(entry, input);

            return;
        }

        const nextAmount = convertToMicroUnits(entry.amount);
        const nextBaseValuation = yield* entryBaseValuationService.valueMicroUnitEntry({
            accountId: entry.accountId,
            amount: nextAmount,
            operatedAt: input.operatedAt,
            externalSource: input.externalSource
        });
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

        yield* Effect.all([
            transactionEntryRepository.updateByExternalIdAndAccountId(entry.externalId, entry.accountId, {
                amount: nextAmount,
                exchangeRate: entry.exchangeRate,
                ...nextBaseValuation,
                toIban: entry.toIban,
                mccCategoryId: nextMccCategoryId
            }),
            transactionRepository.updateById(existingEntry.originalTransactionId ?? existingEntry.transactionId, {
                title: input.title,
                comment: input.comment,
                operatedAt: input.operatedAt
            })
        ]);
    });

    private readonly createMissingEntry = Effect.fnUntraced(function* (
        entry: TransactionEntryCreateInputInterface,
        input: TransactionCreateInputInterface
    ) {
        if (!isDefined(input.externalId)) {
            return;
        }

        const primaryEntry = yield* transactionEntryRepository.findByExternalIdAndAccountId(input.externalId, entry.accountId);

        if (!isDefined(primaryEntry)) {
            return;
        }

        const valuations = yield* entryBaseValuationService.valueEntries([entry], input.operatedAt);

        yield* transactionEntryRepository.create({
            ...transactionMapEntryInputToCreateEntity(entry, primaryEntry.transactionId, valuations.get(entry)),
            originalTransactionId: primaryEntry.originalTransactionId
        });
    });
}

export const importedTransactionEntryUpdateService = new ImportedTransactionEntryUpdateService();
