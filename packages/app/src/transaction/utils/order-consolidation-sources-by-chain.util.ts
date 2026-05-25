import { TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { SourceGroupInterface } from '../interface/source-group.interface';
import type { ConsolidationSourceRowInterface } from '@budgie/contracts';

const compareEntryWithinSource = (left: ConsolidationSourceRowInterface, right: ConsolidationSourceRowInterface): number => {
    if (left.entryType !== right.entryType) {
        return left.entryType === TransactionEntryTypeEnum.DEBIT ? -1 : 1;
    }

    return left.entryId - right.entryId;
};

const buildEntriesById = (rows: readonly ConsolidationSourceRowInterface[]): Map<number, ConsolidationSourceRowInterface[]> => {
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

const toSourceGroup = (id: number, entries: ConsolidationSourceRowInterface[], insertionIndex: number): SourceGroupInterface => {
    const sortedEntries = [...entries].sort(compareEntryWithinSource);
    const isTransfer = sortedEntries[0].sourceType === TransactionTypeEnum.TRANSFER;
    const debit = sortedEntries.find(entry => entry.entryType === TransactionEntryTypeEnum.DEBIT);
    const credit = sortedEntries.find(entry => entry.entryType === TransactionEntryTypeEnum.CREDIT);

    return {
        id,
        entries: sortedEntries,
        fromAccountId: isTransfer && isDefined(debit) ? debit.accountId : null,
        toAccountId: isTransfer && isDefined(credit) ? credit.accountId : null,
        operatedAtMs: sortedEntries[0].sourceOperatedAtMs,
        insertionIndex
    };
};

const buildSourceGroups = (rows: readonly ConsolidationSourceRowInterface[]): SourceGroupInterface[] => {
    const byId = buildEntriesById(rows);
    const groups: SourceGroupInterface[] = [];
    let insertionIndex = 0;
    for (const [id, entries] of byId) {
        groups.push(toSourceGroup(id, entries, insertionIndex));
        insertionIndex += 1;
    }

    return groups;
};

const buildToAccountCounts = (groups: readonly SourceGroupInterface[]): Map<number, number> => {
    const counts = new Map<number, number>();
    for (const group of groups) {
        if (isDefined(group.toAccountId)) {
            counts.set(group.toAccountId, (counts.get(group.toAccountId) ?? 0) + 1);
        }
    }

    return counts;
};

const compareGroupOrder = (left: SourceGroupInterface, right: SourceGroupInterface): number => {
    if (left.operatedAtMs !== right.operatedAtMs) {
        return left.operatedAtMs - right.operatedAtMs;
    }

    return left.insertionIndex - right.insertionIndex;
};

const isChainHead = (candidate: SourceGroupInterface, toAccountCounts: Map<number, number>): boolean => {
    if (!isDefined(candidate.fromAccountId)) {
        return false;
    }
    const count = toAccountCounts.get(candidate.fromAccountId) ?? 0;

    return count === 0;
};

const findHeadIndex = (remaining: readonly SourceGroupInterface[], toAccountCounts: Map<number, number>): number => {
    let chosen = -1;
    for (let index = 0; index < remaining.length; index += 1) {
        const candidate = remaining[index];
        const isBetter = chosen === -1 || compareGroupOrder(candidate, remaining[chosen]) < 0;
        if (isChainHead(candidate, toAccountCounts) && isBetter) {
            chosen = index;
        }
    }

    return chosen;
};

const findFallbackIndex = (remaining: readonly SourceGroupInterface[]): number => {
    let earliest = 0;
    for (let index = 1; index < remaining.length; index += 1) {
        if (compareGroupOrder(remaining[index], remaining[earliest]) < 0) {
            earliest = index;
        }
    }

    return earliest;
};

const findNextInChainIndex = (remaining: readonly SourceGroupInterface[], targetAccountId: number): number => {
    let chosen = -1;
    for (let index = 0; index < remaining.length; index += 1) {
        const candidate = remaining[index];
        const matches = candidate.fromAccountId === targetAccountId;
        const isBetter = chosen === -1 || compareGroupOrder(candidate, remaining[chosen]) < 0;
        if (matches && isBetter) {
            chosen = index;
        }
    }

    return chosen;
};

const consumeAt = (remaining: SourceGroupInterface[], index: number, toAccountCounts: Map<number, number>): SourceGroupInterface => {
    const [removed] = remaining.splice(index, 1);
    if (isDefined(removed.toAccountId)) {
        const count = toAccountCounts.get(removed.toAccountId) ?? 0;
        if (count <= 1) {
            toAccountCounts.delete(removed.toAccountId);
        } else {
            toAccountCounts.set(removed.toAccountId, count - 1);
        }
    }

    return removed;
};

const walkChainFrom = (
    start: SourceGroupInterface,
    remaining: SourceGroupInterface[],
    toAccountCounts: Map<number, number>,
    ordered: SourceGroupInterface[]
): void => {
    let current = start;
    ordered.push(current);
    while (isDefined(current.toAccountId) && isNotEmptyArray(remaining)) {
        const targetAccountId = current.toAccountId;
        const nextIndex = findNextInChainIndex(remaining, targetAccountId);
        if (nextIndex === -1) {
            break;
        }
        current = consumeAt(remaining, nextIndex, toAccountCounts);
        ordered.push(current);
    }
};

export const orderConsolidationSourcesByChain = (rows: readonly ConsolidationSourceRowInterface[]): ConsolidationSourceRowInterface[] => {
    if (rows.length <= 1) {
        return [...rows];
    }
    const groups = buildSourceGroups(rows);
    const toAccountCounts = buildToAccountCounts(groups);
    const remaining = [...groups];
    const ordered: SourceGroupInterface[] = [];
    while (isNotEmptyArray(remaining)) {
        const headIndex = findHeadIndex(remaining, toAccountCounts);
        const startIndex = headIndex === -1 ? findFallbackIndex(remaining) : headIndex;
        const start = consumeAt(remaining, startIndex, toAccountCounts);
        walkChainFrom(start, remaining, toAccountCounts, ordered);
    }

    return ordered.flatMap(group => [...group.entries]);
};
