import { TransactionTypeEnum, YieldKindEnum, convertFromMicroUnits } from '@budgie/contracts';
import { YieldPositionSectionEnum } from '@budgie/market';
import { format } from 'date-fns/format';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';
import { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import { YieldListSectionEnum } from '../enum/yield-list-section.enum';
import { YieldPayoutDateFormatEnum } from '../enum/yield-payout-date-format.enum';

import { getYieldPayoutEntry } from './get-yield-payout-entry.util';

import type { YieldPayoutFoldInterface } from '../interface/yield-payout-fold.interface';
import type { YieldListItemType } from '../type/yield-list-item.type';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { YieldPositionSummaryInterface } from '@budgie/market';

const DAY_KEY_FORMAT = 'yyyy-MM-dd';
const MONTH_KEY_FORMAT = 'yyyy-MM';

const toSection = (section: YieldListSectionEnum, hasTax = false): YieldListItemType => ({
    kind: YieldListItemKindEnum.SECTION,
    id: `section-${section}`,
    section,
    hasTax
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

    return Math.abs(convertFromMicroUnits(baseAmounts.reduce((total, amount) => total + amount, 0)));
};

const toRowLastDate = ({ transaction, siblings }: YieldPayoutFoldInterface): number =>
    Math.max(transaction.operatedAt.getTime(), ...siblings.map(sibling => sibling.operatedAt.getTime()));

const toMonthTotal = (rows: readonly YieldPayoutFoldInterface[]): number =>
    rows.reduce((total, row) => total + toRowDisplayedAmount(row), 0);

const toPayoutItem = (
    { transaction, tax, siblings }: YieldPayoutFoldInterface,
    isUnassigned: boolean,
    position: TransactionListRowPositionEnum,
    dateFormat: YieldPayoutDateFormatEnum
): YieldListItemType => ({
    kind: YieldListItemKindEnum.PAYOUT,
    id: `payout-${transaction.id}`,
    transaction,
    tax,
    siblings,
    isUnassigned,
    dateFormat,
    position
});

const toPayouts = (payouts: readonly TransactionWithRelationsEntityInterface[], isUnassigned: boolean): YieldListItemType[] => {
    const months = groupBy(
        groupBy(payouts, transaction => format(transaction.operatedAt, DAY_KEY_FORMAT)).flatMap(foldTaxIntoIncome),
        ({ transaction }) => format(transaction.operatedAt, MONTH_KEY_FORMAT)
    ).map(rows =>
        mergeRepeatedPayouts(rows).sort(
            (left, right) => toRowLastDate(right) - toRowLastDate(left) || left.transaction.title.localeCompare(right.transaction.title)
        )
    );

    if (months.every(rows => rows.length <= 1)) {
        const rows = months.flat();

        return rows.map((row, index) =>
            toPayoutItem(row, isUnassigned, toRowPosition(index, rows.length), YieldPayoutDateFormatEnum.DAY_MONTH_YEAR)
        );
    }

    return months.flatMap((merged): YieldListItemType[] => {
        const first = merged[0].transaction;
        const header: YieldListItemType = {
            kind: YieldListItemKindEnum.MONTH,
            id: `month-${format(first.operatedAt, MONTH_KEY_FORMAT)}-${isUnassigned}`,
            month: first.operatedAt,
            total: merged.length === 1 ? null : toMonthTotal(merged)
        };

        return [
            header,
            ...merged.map((row, index) =>
                toPayoutItem(row, isUnassigned, toRowPosition(index, merged.length), YieldPayoutDateFormatEnum.DAY_MONTH)
            )
        ];
    });
};

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
    unassigned: readonly TransactionWithRelationsEntityInterface[] | null
): YieldListItemType[] => {
    if (!isDefined(unassigned)) {
        return isNotEmptyArray(payouts) ? [toSection(YieldListSectionEnum.PAYOUTS, payouts.some(isTax)), ...toPayouts(payouts, false)] : [];
    }

    const active = positions.filter(position => position.section === YieldPositionSectionEnum.ACTIVE);
    const closed = positions.filter(position => position.section === YieldPositionSectionEnum.CLOSED);
    const unassignedIds = new Set(unassigned.map(({ id }) => id));
    const assigned = payouts.filter(({ id }) => !unassignedIds.has(id));

    return [
        ...(isNotEmptyArray(active) ? [toSection(YieldListSectionEnum.ACTIVE), ...toPositions(active, rangeCaption)] : []),
        ...(isNotEmptyArray(closed) ? [toSection(YieldListSectionEnum.CLOSED), ...toPositions(closed, rangeCaption)] : []),
        ...(isNotEmptyArray(unassigned) ? [toSection(YieldListSectionEnum.UNASSIGNED), ...toPayouts(unassigned, true)] : []),
        ...(isNotEmptyArray(assigned) ? [toSection(YieldListSectionEnum.PAYOUTS, assigned.some(isTax)), ...toPayouts(assigned, false)] : [])
    ];
};
