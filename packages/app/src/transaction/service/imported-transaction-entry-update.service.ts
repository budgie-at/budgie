import { isDefined } from '@rnw-community/shared';

import { transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';

import type { DB, TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

class ImportedTransactionEntryUpdateService {
    async update(entries: readonly TransactionEntryCreateInputInterface[], input: TransactionCreateInputInterface, tx: DB): Promise<void> {
        const [entry, ...remainingEntries] = entries;
        if (!isDefined(entry)) {
            return;
        }

        await this.updateEntry(entry, input, tx);
        await this.update(remainingEntries, input, tx);
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
