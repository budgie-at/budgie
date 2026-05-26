import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { ImportedEntryMatchInterface } from '../interface/imported-entry-match.interface';
import { RefreshedImportedEntriesResultInterface } from '../interface/refreshed-imported-entries-result.interface';
import { RefreshedImportedEntriesStatusEnum } from '../type/refreshed-imported-entries-status.enum';

import type { BuildRefreshedImportedEntriesInputInterface } from '../interface/build-refreshed-imported-entries-input.interface';
import type {
    DB,
    TransactionCreateInputInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

class RefreshedImportedEntriesService {
    async build(input: BuildRefreshedImportedEntriesInputInterface, tx: DB): Promise<RefreshedImportedEntriesResultInterface> {
        if (input.existingEntries.length !== input.inputEntries.length) {
            return { status: RefreshedImportedEntriesStatusEnum.LENGTH_MISMATCH, entries: null };
        }

        const remainingInputEntries = [...input.inputEntries];
        const refreshedEntries: TransactionEntryCreateEntityInterface[] = [];

        for (const existingEntry of input.existingEntries) {
            const importedEntryMatch = this.findImportedEntryMatch(existingEntry, remainingInputEntries);

            if (!isDefined(importedEntryMatch.matchingInputIndex)) {
                return { status: importedEntryMatch.status, entries: null };
            }

            const [matchingInput] = remainingInputEntries.splice(importedEntryMatch.matchingInputIndex, 1);
            refreshedEntries.push(this.buildRefreshedImportedEntry(existingEntry, matchingInput, input.transactionId));
        }

        return {
            status: RefreshedImportedEntriesStatusEnum.REFRESHED,
            entries: await Promise.all(refreshedEntries.map(entry => this.addBaseValuation(entry, input.input, tx)))
        };
    }

    private buildRefreshedImportedEntry(
        existingEntry: TransactionEntryEntityInterface,
        matchingInput: TransactionEntryCreateInputInterface,
        transactionId: number
    ): TransactionEntryCreateEntityInterface {
        return {
            transactionId,
            accountId: existingEntry.accountId,
            categoryId: existingEntry.categoryId,
            categorySource: existingEntry.categorySource,
            mccCategoryId: existingEntry.mccCategoryId,
            type: existingEntry.type,
            amount: existingEntry.amount,
            externalId: matchingInput.externalId ?? existingEntry.externalId,
            exchangeRate: matchingInput.exchangeRate ?? existingEntry.exchangeRate,
            toIban: matchingInput.toIban ?? existingEntry.toIban
        };
    }

    private async addBaseValuation(
        entry: TransactionEntryCreateEntityInterface,
        input: TransactionCreateInputInterface,
        tx: DB
    ): Promise<TransactionEntryCreateEntityInterface> {
        const valuation = await entryBaseValuationService.valueMicroUnitEntry({
            accountId: entry.accountId,
            amount: entry.amount,
            operatedAt: input.operatedAt,
            externalSource: input.externalSource,
            tx
        });

        return { ...entry, ...valuation };
    }

    private findImportedEntryMatch(
        existingEntry: TransactionEntryEntityInterface,
        inputEntries: TransactionEntryCreateInputInterface[]
    ): ImportedEntryMatchInterface {
        const externalIdMatchIndex = this.findExternalIdMatchIndex(existingEntry, inputEntries);

        if (isDefined(externalIdMatchIndex)) {
            return {
                status: RefreshedImportedEntriesStatusEnum.REFRESHED,
                matchingInputIndex: externalIdMatchIndex
            };
        }

        const fallbackMatchIndexes = this.findFallbackMatchIndexes(existingEntry, inputEntries);

        if (!isNotEmptyArray(fallbackMatchIndexes)) {
            return {
                status: RefreshedImportedEntriesStatusEnum.NO_MATCH,
                matchingInputIndex: null
            };
        }

        if (fallbackMatchIndexes.length > 1) {
            return {
                status: RefreshedImportedEntriesStatusEnum.AMBIGUOUS_MATCH,
                matchingInputIndex: null
            };
        }

        return {
            status: RefreshedImportedEntriesStatusEnum.REFRESHED,
            matchingInputIndex: fallbackMatchIndexes[0]
        };
    }

    private findExternalIdMatchIndex(
        existingEntry: TransactionEntryEntityInterface,
        inputEntries: TransactionEntryCreateInputInterface[]
    ): number | null {
        if (!isDefined(existingEntry.externalId)) {
            return null;
        }

        const externalIdMatchIndex = inputEntries.findIndex(inputEntry => inputEntry.externalId === existingEntry.externalId);

        return externalIdMatchIndex >= 0 ? externalIdMatchIndex : null;
    }

    private findFallbackMatchIndexes(
        existingEntry: TransactionEntryEntityInterface,
        inputEntries: TransactionEntryCreateInputInterface[]
    ): number[] {
        return inputEntries.flatMap((inputEntry, index) =>
            inputEntry.accountId === existingEntry.accountId && inputEntry.type === existingEntry.type ? [index] : []
        );
    }
}

export const refreshedImportedEntriesService = new RefreshedImportedEntriesService();
