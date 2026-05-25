import { TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { useEffect, useState } from 'react';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { ConsolidationSourceRowInterface, TransactionConsolidationTypeEnum } from '@budgie/contracts';

const logger = getLogger('useGetConsolidationSourcesQuery');

interface SourceGroup {
    readonly id: number;
    readonly entries: ConsolidationSourceRowInterface[];
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
    readonly operatedAtMs: number;
}

const compareEntryWithinSource = (left: ConsolidationSourceRowInterface, right: ConsolidationSourceRowInterface): number => {
    if (left.entryType !== right.entryType) {
        return left.entryType === TransactionEntryTypeEnum.DEBIT ? -1 : 1;
    }

    return left.entryId - right.entryId;
};

const buildEntriesById = (rows: ConsolidationSourceRowInterface[]): Map<number, ConsolidationSourceRowInterface[]> => {
    const byId = new Map<number, ConsolidationSourceRowInterface[]>();
    for (const row of rows) {
        const existing = byId.get(row.sourceTransactionId);
        if (isDefined(existing)) {
            existing.push(row);
        } else {
            byId.set(row.sourceTransactionId, [row]);
        }
    }

    return byId;
};

const toSourceGroup = (id: number, entries: ConsolidationSourceRowInterface[]): SourceGroup => {
    const sortedEntries = [...entries].sort(compareEntryWithinSource);
    const isTransfer = sortedEntries[0].sourceType === TransactionTypeEnum.TRANSFER;
    const debit = sortedEntries.find(entry => entry.entryType === TransactionEntryTypeEnum.DEBIT);
    const credit = sortedEntries.find(entry => entry.entryType === TransactionEntryTypeEnum.CREDIT);

    return {
        id,
        entries: sortedEntries,
        fromAccountId: isTransfer && isDefined(debit) ? debit.accountId : null,
        toAccountId: isTransfer && isDefined(credit) ? credit.accountId : null,
        operatedAtMs: sortedEntries[0].sourceOperatedAtMs
    };
};

const buildSourceGroups = (rows: ConsolidationSourceRowInterface[]): SourceGroup[] => {
    const byId = buildEntriesById(rows);
    const groups: SourceGroup[] = [];
    for (const [id, entries] of byId) {
        groups.push(toSourceGroup(id, entries));
    }

    return groups;
};

const buildToAccountIds = (groups: SourceGroup[]): Set<number> => {
    const ids = new Set<number>();
    for (const group of groups) {
        if (isDefined(group.toAccountId)) {
            ids.add(group.toAccountId);
        }
    }

    return ids;
};

const findEarliestIndex = (groups: SourceGroup[]): number => {
    let earliest = 0;
    for (let index = 1; index < groups.length; index += 1) {
        if (groups[index].operatedAtMs < groups[earliest].operatedAtMs) {
            earliest = index;
        }
    }

    return earliest;
};

const isChainHead = (candidate: SourceGroup, toAccountIds: Set<number>): boolean =>
    isDefined(candidate.fromAccountId) && !toAccountIds.has(candidate.fromAccountId);

const findChainHeadIndex = (remaining: SourceGroup[], toAccountIds: Set<number>): number => {
    let chosen = -1;
    for (let index = 0; index < remaining.length; index += 1) {
        const candidate = remaining[index];
        const isBetter = chosen === -1 || candidate.operatedAtMs < remaining[chosen].operatedAtMs;
        if (isChainHead(candidate, toAccountIds) && isBetter) {
            chosen = index;
        }
    }

    return chosen === -1 ? findEarliestIndex(remaining) : chosen;
};

const popAt = (groups: SourceGroup[], index: number): SourceGroup => {
    const [removed] = groups.splice(index, 1);

    return removed;
};

const recordConsumed = (group: SourceGroup, toAccountIds: Set<number>, ordered: SourceGroup[]): void => {
    ordered.push(group);
    if (isDefined(group.toAccountId)) {
        toAccountIds.delete(group.toAccountId);
    }
};

const walkChainFrom = (start: SourceGroup, remaining: SourceGroup[], toAccountIds: Set<number>, ordered: SourceGroup[]): void => {
    let lastToAccountId = start.toAccountId;
    recordConsumed(start, toAccountIds, ordered);
    while (isDefined(lastToAccountId) && isNotEmptyArray(remaining)) {
        const targetAccountId = lastToAccountId;
        const nextIndex = remaining.findIndex(group => group.fromAccountId === targetAccountId);
        if (nextIndex === -1) {
            break;
        }
        const next = popAt(remaining, nextIndex);
        recordConsumed(next, toAccountIds, ordered);
        lastToAccountId = next.toAccountId;
    }
};

const orderByTransferChain = (rows: ConsolidationSourceRowInterface[]): ConsolidationSourceRowInterface[] => {
    if (rows.length <= 1) {
        return rows;
    }
    const groups = buildSourceGroups(rows);
    const toAccountIds = buildToAccountIds(groups);
    const remaining = [...groups];
    const ordered: SourceGroup[] = [];
    while (isNotEmptyArray(remaining)) {
        const headIndex = findChainHeadIndex(remaining, toAccountIds);
        const head = popAt(remaining, headIndex);
        walkChainFrom(head, remaining, toAccountIds, ordered);
    }

    return ordered.flatMap(group => group.entries);
};

export const useGetConsolidationSourcesQuery = (transactionId: number) => {
    const language = useSetting('language');
    const [sources, setSources] = useState<ConsolidationSourceRowInterface[]>([]);
    const [consolidationType, setConsolidationType] = useState<TransactionConsolidationTypeEnum | null>(null);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const handleError = (caughtError: unknown) => {
            logger.error('failed', { transactionId, errorMessage: getErrorMessage(caughtError) });
            if (isActive) {
                setHasError(true);
                setSources([]);
                setIsLoading(false);
            }
        };

        const fetchData = async (): Promise<void> => {
            const [rows, canonical] = await Promise.all([
                transactionRepository.findConsolidationSources(transactionId),
                transactionRepository.getById(transactionId, language)
            ]);
            if (isActive) {
                setSources(orderByTransferChain(rows));
                setConsolidationType(isDefined(canonical) ? canonical.consolidationType : null);
                setHasError(false);
                setIsLoading(false);
            }
        };

        void fetchData().catch(handleError);

        return () => {
            isActive = false;
        };
    }, [transactionId, language]);

    return { sources, consolidationType, hasError, isLoading };
};
