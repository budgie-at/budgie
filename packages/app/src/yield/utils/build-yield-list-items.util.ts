import { TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { YieldPositionSectionEnum } from '@budgie/market';
import { format } from 'date-fns/format';

import { isNotEmptyArray } from '@rnw-community/shared';

import { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';
import { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import { YieldListSectionEnum } from '../enum/yield-list-section.enum';

import type { YieldListItemType } from '../type/yield-list-item.type';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { YieldPositionSummaryInterface } from '@budgie/market';

const DAY_KEY_FORMAT = 'yyyy-MM-dd';

const toSection = (section: YieldListSectionEnum): YieldListItemType => ({
    kind: YieldListItemKindEnum.SECTION,
    id: `section-${section}`,
    section
});

const toRowPosition = (index: number, count: number): TransactionListRowPositionEnum => {
    if (count === 1) {
        return TransactionListRowPositionEnum.SINGLE;
    }

    if (index === 0) {
        return TransactionListRowPositionEnum.FIRST;
    }

    return index === count - 1 ? TransactionListRowPositionEnum.LAST : TransactionListRowPositionEnum.MIDDLE;
};

const toPayoutAccountId = (transaction: TransactionWithRelationsEntityInterface): number | null =>
    transaction.type === TransactionTypeEnum.EXPENSE ? transaction.fromAccountId : transaction.toAccountId;

const isTax = (transaction: TransactionWithRelationsEntityInterface): boolean => transaction.yieldKind === YieldKindEnum.TAX;

const groupByDay = (payouts: readonly TransactionWithRelationsEntityInterface[]): TransactionWithRelationsEntityInterface[][] => {
    const days = new Map<string, TransactionWithRelationsEntityInterface[]>();

    for (const transaction of payouts) {
        const day = format(transaction.operatedAt, DAY_KEY_FORMAT);

        days.set(day, [...(days.get(day) ?? []), transaction]);
    }

    return [...days.values()];
};

const taxAfterIncome = (day: readonly TransactionWithRelationsEntityInterface[]): TransactionWithRelationsEntityInterface[] => {
    const taxes = day.filter(isTax);
    const incomes = day.filter(transaction => !isTax(transaction));
    const claimed = new Set<number>();

    const ordered = incomes.flatMap(income => {
        const matching = taxes.filter(tax => !claimed.has(tax.id) && toPayoutAccountId(tax) === toPayoutAccountId(income));

        matching.forEach(tax => claimed.add(tax.id));

        return [income, ...matching];
    });

    return [...ordered, ...taxes.filter(tax => !claimed.has(tax.id))];
};

const toPayouts = (payouts: readonly TransactionWithRelationsEntityInterface[], isUnassigned: boolean): YieldListItemType[] =>
    groupByDay(payouts).flatMap((day): YieldListItemType[] => {
        const ordered = taxAfterIncome(day);
        const [first] = ordered;
        const header: YieldListItemType = {
            kind: YieldListItemKindEnum.DATE,
            id: `date-${format(first.operatedAt, DAY_KEY_FORMAT)}-${isUnassigned}`,
            date: first.operatedAt
        };
        const rows = ordered.map((transaction, index): YieldListItemType => ({
            kind: YieldListItemKindEnum.PAYOUT,
            id: `payout-${transaction.id}`,
            transaction,
            isUnassigned,
            position: toRowPosition(index, ordered.length)
        }));

        return [header, ...rows];
    });

const toPositions = (positions: readonly YieldPositionSummaryInterface[], rangeCaption: string): YieldListItemType[] =>
    positions.map((position, index) => ({
        kind: YieldListItemKindEnum.POSITION,
        id: `position-${position.accountId}`,
        position,
        rangeCaption,
        rowPosition: toRowPosition(index, positions.length)
    }));

export const buildYieldListItems = (
    positions: readonly YieldPositionSummaryInterface[],
    payouts: readonly TransactionWithRelationsEntityInterface[],
    rangeCaption: string,
    isPayoutMode: boolean
): YieldListItemType[] => {
    if (isPayoutMode) {
        return isNotEmptyArray(payouts) ? [toSection(YieldListSectionEnum.PAYOUTS), ...toPayouts(payouts, false)] : [];
    }

    const active = positions.filter(position => position.section === YieldPositionSectionEnum.ACTIVE);
    const closed = positions.filter(position => position.section === YieldPositionSectionEnum.CLOSED);

    return [
        ...(isNotEmptyArray(active) ? [toSection(YieldListSectionEnum.ACTIVE), ...toPositions(active, rangeCaption)] : []),
        ...(isNotEmptyArray(closed) ? [toSection(YieldListSectionEnum.CLOSED), ...toPositions(closed, rangeCaption)] : []),
        ...(isNotEmptyArray(payouts) ? [toSection(YieldListSectionEnum.UNASSIGNED), ...toPayouts(payouts, true)] : [])
    ];
};
