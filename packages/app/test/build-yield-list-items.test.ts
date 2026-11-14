import { AccountTypeEnum, InstrumentTypeEnum, PERSONAL_SYNC_ZONE, TransactionTypeEnum } from '@budgie/contracts';
import { YieldPositionSectionEnum } from '@budgie/market';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { YieldListItemKindEnum } from '../src/yield/enum/yield-list-item-kind.enum';
import { YieldListSectionEnum } from '../src/yield/enum/yield-list-section.enum';
import { buildYieldListItems } from '../src/yield/utils/build-yield-list-items.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { YieldPositionSummaryInterface } from '@budgie/market';

const TIMESTAMP = new Date('2026-10-01T00:00:00Z');

const position = (accountId: number, section: YieldPositionSectionEnum): YieldPositionSummaryInterface => ({
    accountId,
    title: 'Position',
    accountType: AccountTypeEnum.DEPOSIT,
    instrumentCode: 'EUR',
    instrumentSymbol: '€',
    instrumentType: InstrumentTypeEnum.FIAT,
    section,
    earned: 0,
    isEarnedEstimated: false,
    rewardUnits: 0,
    tax: 0,
    annualYield: { rate: null, reason: null, isEstimated: false },
    accruing: null,
    isAccruingEstimated: false,
    interestRate: null,
    deadline: null,
    vsRate: null
});

const payout = (id: number): TransactionWithRelationsEntityInterface => ({
    id,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: null,
    syncId: `transaction-${id}`,
    syncZone: PERSONAL_SYNC_ZONE,
    type: TransactionTypeEnum.INCOME,
    title: 'Payout',
    externalId: null,
    operatedAt: TIMESTAMP,
    comment: '',
    toAccountId: null,
    fromAccountId: null,
    exchangeRate: 1,
    externalSource: null,
    updatedBy: null,
    needsEmbedding: false,
    importFingerprint: null,
    consolidationParentTransactionId: null,
    consolidationType: null,
    fundAccountId: null,
    yieldKind: null,
    yieldSourceAccountId: null,
    operatedWeekday: 4,
    operatedMinuteOfDay: 0,
    entries: [],
    debtEvents: [],
    fromAccount: null,
    toAccount: null,
    receipt: null,
    transactionTags: []
});

it.effect('lists active, closed and unassigned sections in order', () =>
    Effect.sync(() => {
        const items = buildYieldListItems(
            [position(1, YieldPositionSectionEnum.CLOSED), position(2, YieldPositionSectionEnum.ACTIVE)],
            [payout(9)],
            'since 1 Nov',
            false
        );

        expect(items.map(item => item.id)).toEqual([
            `section-${YieldListSectionEnum.ACTIVE}`,
            'position-2',
            `section-${YieldListSectionEnum.CLOSED}`,
            'position-1',
            `section-${YieldListSectionEnum.UNASSIGNED}`,
            'payout-9'
        ]);
        expect(items.at(-1)).toMatchObject({ kind: YieldListItemKindEnum.PAYOUT, isUnassigned: true });
    })
);

it.effect('omits empty sections', () =>
    Effect.sync(() => {
        expect(buildYieldListItems([], [], 'caption', false)).toEqual([]);
        expect(buildYieldListItems([position(1, YieldPositionSectionEnum.ACTIVE)], [], 'caption', false).map(item => item.id)).toEqual([
            `section-${YieldListSectionEnum.ACTIVE}`,
            'position-1'
        ]);
    })
);

it.effect('shows only the payouts section in payout mode', () =>
    Effect.sync(() => {
        const items = buildYieldListItems([position(1, YieldPositionSectionEnum.ACTIVE)], [payout(3), payout(4)], 'caption', true);

        expect(items.map(item => item.id)).toEqual([`section-${YieldListSectionEnum.PAYOUTS}`, 'payout-3', 'payout-4']);
        expect(items.at(-1)).toMatchObject({ isUnassigned: false });
        expect(buildYieldListItems([position(1, YieldPositionSectionEnum.ACTIVE)], [], 'caption', true)).toEqual([]);
    })
);
