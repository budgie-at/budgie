import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';

import type { DB, TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

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
        (entries, input, tx) =>
            `enter externalId=${input.externalId} entryExternalIds=${entries.map(entry => entry.externalId).join(',')} hasTx=${String(isDefined(tx))}`,
        (result, entries, input, tx) =>
            `done result=${String(result)} externalId=${input.externalId} entryExternalIds=${entries.map(entry => entry.externalId).join(',')} hasTx=${String(isDefined(tx))}`,
        (error, entries, input) =>
            `throw externalId=${input.externalId} entryExternalIds=${entries.map(entry => entry.externalId).join(',')} error=${getErrorMessage(error)}`
    )
    async update(entries: readonly TransactionEntryCreateInputInterface[], input: TransactionCreateInputInterface, tx: DB): Promise<void> {
        await entries.reduce(
            (previousEntryPromise, entry) => previousEntryPromise.then(() => this.updateEntry(entry, input, tx)),
            Promise.resolve()
        );
    }

    private async updateEntry(entry: TransactionEntryCreateInputInterface, input: TransactionCreateInputInterface, tx: DB): Promise<void> {
        if (!isDefined(entry.externalId)) {
            return;
        }

        const existingEntry = await transactionEntryRepository.findByExternalIdAndAccountId(entry.externalId, entry.accountId, tx);

        if (!isDefined(existingEntry)) {
            return;
        }

        const nextAmount = convertToMicroUnits(entry.amount);
        const nextBaseValuation = await entryBaseValuationService.valueMicroUnitEntry({
            accountId: entry.accountId,
            amount: nextAmount,
            operatedAt: input.operatedAt,
            externalSource: input.externalSource,
            tx
        });

        if (
            existingEntry.amount === nextAmount &&
            existingEntry.exchangeRate === entry.exchangeRate &&
            existingEntry.baseInstrumentId === nextBaseValuation.baseInstrumentId &&
            existingEntry.baseExchangeRate === nextBaseValuation.baseExchangeRate &&
            existingEntry.baseAmount === nextBaseValuation.baseAmount &&
            existingEntry.toIban === entry.toIban
        ) {
            return;
        }

        await transactionEntryRepository.updateByExternalIdAndAccountId(
            entry.externalId,
            entry.accountId,
            {
                amount: nextAmount,
                exchangeRate: entry.exchangeRate,
                ...nextBaseValuation,
                toIban: entry.toIban
            },
            tx
        );

        const metadataTransactionId = existingEntry.originalTransactionId ?? existingEntry.transactionId;

        await transactionRepository.updateById(
            metadataTransactionId,
            {
                title: input.title,
                comment: input.comment,
                operatedAt: input.operatedAt
            },
            tx
        );
    }
}

export const importedTransactionEntryUpdateService = new ImportedTransactionEntryUpdateService();
