import { EntryBaseValuationService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ImportedEntryMatchInterface } from '../interface/imported-entry-match.interface';
import { RefreshedImportedEntriesStatusEnum } from '../type/refreshed-imported-entries-status.enum';

import type { BuildRefreshedImportedEntriesInputInterface } from '../interface/build-refreshed-imported-entries-input.interface';
import type {
    TransactionCreateInputInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

export class RefreshedImportedEntriesService extends Context.Service<RefreshedImportedEntriesService>()(
    '@budgie/app/RefreshedImportedEntriesService',
    {
        make: Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;

            const addBaseValuation = Effect.fnUntraced(function* (
                entry: TransactionEntryCreateEntityInterface,
                input: TransactionCreateInputInterface
            ) {
                const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                    accountId: entry.accountId,
                    amount: entry.amount,
                    operatedAt: input.operatedAt
                });

                return { ...entry, ...valuation };
            });

            const buildRefreshedImportedEntry = (
                existingEntry: TransactionEntryEntityInterface,
                matchingInput: TransactionEntryCreateInputInterface,
                transactionId: number
            ): TransactionEntryCreateEntityInterface => ({
                transactionId,
                accountId: existingEntry.accountId,
                categoryId: existingEntry.categoryId,
                categorySource: existingEntry.categorySource,
                mccCategoryId: existingEntry.mccCategoryId,
                type: existingEntry.type,
                kind: existingEntry.kind,
                amount: existingEntry.amount,
                externalId: matchingInput.externalId ?? existingEntry.externalId,
                exchangeRate: matchingInput.exchangeRate ?? existingEntry.exchangeRate,
                toIban: matchingInput.toIban ?? existingEntry.toIban
            });

            const findExternalIdMatchIndex = (
                existingEntry: TransactionEntryEntityInterface,
                inputEntries: TransactionEntryCreateInputInterface[]
            ): number | null => {
                if (!isDefined(existingEntry.externalId)) {
                    return null;
                }

                const externalIdMatchIndex = inputEntries.findIndex(inputEntry => inputEntry.externalId === existingEntry.externalId);

                return externalIdMatchIndex >= 0 ? externalIdMatchIndex : null;
            };

            const findFallbackMatchIndexes = (
                existingEntry: TransactionEntryEntityInterface,
                inputEntries: TransactionEntryCreateInputInterface[]
            ): number[] =>
                inputEntries.flatMap((inputEntry, index) =>
                    inputEntry.accountId === existingEntry.accountId && inputEntry.type === existingEntry.type ? [index] : []
                );

            const findImportedEntryMatch = (
                existingEntry: TransactionEntryEntityInterface,
                inputEntries: TransactionEntryCreateInputInterface[]
            ): ImportedEntryMatchInterface => {
                const externalIdMatchIndex = findExternalIdMatchIndex(existingEntry, inputEntries);

                if (isDefined(externalIdMatchIndex)) {
                    return {
                        status: RefreshedImportedEntriesStatusEnum.REFRESHED,
                        matchingInputIndex: externalIdMatchIndex
                    };
                }

                const fallbackMatchIndexes = findFallbackMatchIndexes(existingEntry, inputEntries);

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
            };

            return {
                build: Effect.fn('RefreshedImportedEntriesService.build')(function* (input: BuildRefreshedImportedEntriesInputInterface) {
                    if (input.existingEntries.length !== input.inputEntries.length) {
                        return { status: RefreshedImportedEntriesStatusEnum.LENGTH_MISMATCH, entries: null };
                    }

                    const remainingInputEntries = [...input.inputEntries];
                    const refreshedEntries: TransactionEntryCreateEntityInterface[] = [];

                    for (const existingEntry of input.existingEntries) {
                        const importedEntryMatch = findImportedEntryMatch(existingEntry, remainingInputEntries);

                        if (!isDefined(importedEntryMatch.matchingInputIndex)) {
                            return { status: importedEntryMatch.status, entries: null };
                        }

                        const [matchingInput] = remainingInputEntries.splice(importedEntryMatch.matchingInputIndex, 1);
                        refreshedEntries.push(buildRefreshedImportedEntry(existingEntry, matchingInput, input.transactionId));
                    }

                    return {
                        status: RefreshedImportedEntriesStatusEnum.REFRESHED,
                        entries: yield* Effect.forEach(refreshedEntries, entry => addBaseValuation(entry, input.input), {
                            concurrency: 'unbounded'
                        })
                    };
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(RefreshedImportedEntriesService, RefreshedImportedEntriesService.make).pipe(
        Layer.provide(EntryBaseValuationService.layer)
    );
}
