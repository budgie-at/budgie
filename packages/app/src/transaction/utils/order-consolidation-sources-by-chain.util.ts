import { TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { SourceGroupInterface } from '../interface/source-group.interface';
import type { ConsolidationSourceRowInterface } from '@budgie/contracts';

const compareEntry = (left: ConsolidationSourceRowInterface, right: ConsolidationSourceRowInterface): number => {
    if (left.entryType !== right.entryType) {
        return left.entryType === TransactionEntryTypeEnum.DEBIT ? -1 : 1;
    }

    return left.entryId - right.entryId;
};

const buildGroups = (rows: readonly ConsolidationSourceRowInterface[]): SourceGroupInterface[] => {
    const byId = new Map<number, ConsolidationSourceRowInterface[]>();
    for (const row of rows) {
        const list = byId.get(row.sourceTransactionId);
        if (isDefined(list)) {
            list.push(row);
        } else {
            byId.set(row.sourceTransactionId, [row]);
        }
    }

    return [...byId.values()].map(entries => {
        const sorted = [...entries].sort(compareEntry);
        const isTransfer = sorted[0].sourceType === TransactionTypeEnum.TRANSFER;
        const debit = sorted.find(entry => entry.entryType === TransactionEntryTypeEnum.DEBIT);
        const credit = sorted.find(entry => entry.entryType === TransactionEntryTypeEnum.CREDIT);

        return {
            entries: sorted,
            fromAccountId: isTransfer && isDefined(debit) ? debit.accountId : null,
            toAccountId: isTransfer && isDefined(credit) ? credit.accountId : null
        };
    });
};

const pickStartIndex = (remaining: readonly SourceGroupInterface[]): number => {
    const liveToAccounts = new Set<number>();
    for (const group of remaining) {
        if (isDefined(group.toAccountId)) {
            liveToAccounts.add(group.toAccountId);
        }
    }
    const headIndex = remaining.findIndex(group => isDefined(group.fromAccountId) && !liveToAccounts.has(group.fromAccountId));

    return headIndex === -1 ? 0 : headIndex;
};

const walkChain = (start: SourceGroupInterface, remaining: SourceGroupInterface[], ordered: SourceGroupInterface[]): void => {
    let current = start;
    ordered.push(current);
    while (isDefined(current.toAccountId) && isNotEmptyArray(remaining)) {
        const targetAccountId = current.toAccountId;
        const nextIndex = remaining.findIndex(group => group.fromAccountId === targetAccountId);
        if (nextIndex === -1) {
            break;
        }
        [current] = remaining.splice(nextIndex, 1);
        ordered.push(current);
    }
};

export const orderConsolidationSourcesByChain = (rows: readonly ConsolidationSourceRowInterface[]): ConsolidationSourceRowInterface[] => {
    const groups = buildGroups(rows);
    if (groups.length <= 1) {
        return groups.flatMap(group => [...group.entries]);
    }
    const remaining = [...groups];
    const ordered: SourceGroupInterface[] = [];
    while (isNotEmptyArray(remaining)) {
        const [start] = remaining.splice(pickStartIndex(remaining), 1);
        walkChain(start, remaining, ordered);
    }

    return ordered.flatMap(group => [...group.entries]);
};
