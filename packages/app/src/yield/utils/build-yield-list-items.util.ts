import { YieldPositionSectionEnum } from '@budgie/market';

import { isNotEmptyArray } from '@rnw-community/shared';

import { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import { YieldListSectionEnum } from '../enum/yield-list-section.enum';

import type { YieldListItemType } from '../type/yield-list-item.type';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { YieldPositionSummaryInterface } from '@budgie/market';

const toSection = (section: YieldListSectionEnum): YieldListItemType => ({
    kind: YieldListItemKindEnum.SECTION,
    id: `section-${section}`,
    section
});

const toPayouts = (payouts: readonly TransactionWithRelationsEntityInterface[], isUnassigned: boolean): YieldListItemType[] =>
    payouts.map(transaction => ({ kind: YieldListItemKindEnum.PAYOUT, id: `payout-${transaction.id}`, transaction, isUnassigned }));

const toPositions = (positions: readonly YieldPositionSummaryInterface[], rangeCaption: string): YieldListItemType[] =>
    positions.map(position => ({ kind: YieldListItemKindEnum.POSITION, id: `position-${position.accountId}`, position, rangeCaption }));

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
