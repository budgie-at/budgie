import { TransactionTypeEnum, YieldKindEnum, convertFromMicroUnits } from '@budgie/contracts';
import { YieldPositionSectionEnum } from '@budgie/market';
import { format } from 'date-fns/format';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';
import { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import { YieldListSectionEnum } from '../enum/yield-list-section.enum';

import { getYieldPayoutEntry } from './get-yield-payout-entry.util';

import type { YieldPayoutFoldInterface } from '../interface/yield-payout-fold.interface';
import type { YieldListItemType } from '../type/yield-list-item.type';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { YieldPositionSummaryInterface } from '@budgie/market';

const DAY_KEY_FORMAT = 'yyyy-MM-dd';
const MONTH_KEY_FORMAT = 'yyyy-MM';

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

const groupBy = <T>(values: readonly T[], toKey: (value: T) => string): T[][] => {
    const groups = new Map<string, T[]>();

    for (const value of values) {
        const key = toKey(value);

        groups.set(key, [...(groups.get(key) ?? []), value]);
    }

    return [...groups.values()];
};

const foldTaxIntoIncome = (day: readonly TransactionWithRelationsEntityInterface[]): YieldPayoutFoldInterface[] => {
    const taxes = day.filter(isTax);
    const claimed = new Set<number>();

    const folded = day
        .filter(transaction => !isTax(transaction))
        .map((income): YieldPayoutFoldInterface => {
            const tax = taxes.find(candidate => !claimed.has(candidate.id) && toPayoutAccountId(candidate) === toPayoutAccountId(income));

            if (isDefined(tax)) {
                claimed.add(tax.id);
            }

            return { transaction: income, tax: tax ?? null, siblings: [] };
        });

    return [
        ...folded,
        ...taxes.filter(tax => !claimed.has(tax.id)).map((tax): YieldPayoutFoldInterface => ({ transaction: tax, tax: null, siblings: [] }))
    ];
};

const MERGE_THRESHOLD = 3;

const toMergeKey = ({ transaction, tax }: YieldPayoutFoldInterface): string =>
    isDefined(tax) || isTax(transaction)
        ? `single-${transaction.id}`
        : `${toPayoutAccountId(transaction)}|${transaction.yieldKind}|${transaction.yieldSourceAccountId}|${transaction.title}`;

const mergeRepeatedPayouts = (rows: readonly YieldPayoutFoldInterface[]): YieldPayoutFoldInterface[] => {
    const groups = groupBy(rows, toMergeKey);
    const emitted = new Set<string>();

    return rows.flatMap((row): YieldPayoutFoldInterface[] => {
        const key = toMergeKey(row);
        const group = groups.find(candidate => toMergeKey(candidate[0]) === key) ?? [];

        if (group.length < MERGE_THRESHOLD) {
            return [row];
        }

        if (emitted.has(key)) {
            return [];
        }

        emitted.add(key);

        return [{ transaction: group[0].transaction, tax: null, siblings: group.map(({ transaction }) => transaction) }];
    });
};

const toRowDisplayedAmount = ({ transaction, siblings }: YieldPayoutFoldInterface): number => {
    if (isTax(transaction)) {
        return 0;
    }

    const sources: readonly TransactionWithRelationsEntityInterface[] = isNotEmptyArray(siblings) ? siblings : [transaction];
    const baseAmounts = sources.map(source => getYieldPayoutEntry(source)?.baseAmount ?? 0);

    return Math.round(Math.abs(convertFromMicroUnits(baseAmounts.reduce((total, amount) => total + amount, 0))));
};

const toMonthTotal = (rows: readonly YieldPayoutFoldInterface[]): number =>
    rows.reduce((total, row) => total + toRowDisplayedAmount(row), 0);

const toPayouts = (payouts: readonly TransactionWithRelationsEntityInterface[], isUnassigned: boolean): YieldListItemType[] =>
    groupBy(groupBy(payouts, transaction => format(transaction.operatedAt, DAY_KEY_FORMAT)).flatMap(foldTaxIntoIncome), ({ transaction }) =>
        format(transaction.operatedAt, MONTH_KEY_FORMAT)
    ).flatMap((rows): YieldListItemType[] => {
        const [{ transaction: first }] = rows;
        const merged = mergeRepeatedPayouts(rows);
        const header: YieldListItemType = {
            kind: YieldListItemKindEnum.MONTH,
            id: `month-${format(first.operatedAt, MONTH_KEY_FORMAT)}-${isUnassigned}`,
            month: first.operatedAt,
            total: toMonthTotal(merged)
        };
        const items = merged.map(({ transaction, tax, siblings }, index): YieldListItemType => ({
            kind: YieldListItemKindEnum.PAYOUT,
            id: `payout-${transaction.id}`,
            transaction,
            tax,
            siblings,
            isUnassigned,
            position: toRowPosition(index, merged.length)
        }));

        return [header, ...items];
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
