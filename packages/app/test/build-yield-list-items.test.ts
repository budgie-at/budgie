import { AccountTypeEnum, InstrumentTypeEnum, PERSONAL_SYNC_ZONE, TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
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

const payout = (id: number, yieldKind: YieldKindEnum | null = null, operatedAt = TIMESTAMP): TransactionWithRelationsEntityInterface => ({
    id,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: null,
    syncId: `transaction-${id}`,
    syncZone: PERSONAL_SYNC_ZONE,
    type: TransactionTypeEnum.INCOME,
    title: 'Payout',
    externalId: null,
    operatedAt,
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
    yieldKind,
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

        expect(items.slice(0, 5).map(item => item.id)).toEqual([
            `section-${YieldListSectionEnum.ACTIVE}`,
            'position-2',
            `section-${YieldListSectionEnum.CLOSED}`,
            'position-1',
            `section-${YieldListSectionEnum.UNASSIGNED}`
        ]);
        expect(items.slice(-1).map(item => item.kind)).toEqual([YieldListItemKindEnum.PAYOUT]);
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

it.effect('groups payouts by month with the income total and folds each tax into its dividend', () =>
    Effect.sync(() => {
        const firstDay = new Date('2026-10-10T12:00:00Z');
        const sameMonth = new Date('2026-10-05T12:00:00Z');
        const previousMonth = new Date('2026-09-20T12:00:00Z');
        const items = buildYieldListItems(
            [position(1, YieldPositionSectionEnum.ACTIVE)],
            [
                payout(3, YieldKindEnum.TAX, firstDay),
                payout(4, null, firstDay),
                payout(5, null, sameMonth),
                payout(6, YieldKindEnum.TAX, sameMonth),
                payout(7, null, previousMonth)
            ],
            'caption',
            true
        );

        expect(items.map(item => item.kind)).toEqual([
            YieldListItemKindEnum.SECTION,
            YieldListItemKindEnum.MONTH,
            YieldListItemKindEnum.PAYOUT,
            YieldListItemKindEnum.PAYOUT,
            YieldListItemKindEnum.PAYOUT
        ]);
        expect(items.filter(item => item.kind === YieldListItemKindEnum.PAYOUT).map(item => item.id)).toEqual([
            'payout-4',
            'payout-5',
            'payout-7'
        ]);
        expect(items.at(2)).toMatchObject({ tax: { id: 3 } });
        expect(items.at(3)).toMatchObject({ tax: { id: 6 } });
        expect(items.at(-1)).toMatchObject({ isUnassigned: false, tax: null });
        expect(buildYieldListItems([position(1, YieldPositionSectionEnum.ACTIVE)], [], 'caption', true)).toEqual([]);
    })
);

it.effect('keeps unmatched tax as its own row', () =>
    Effect.sync(() => {
        const items = buildYieldListItems([], [payout(3, YieldKindEnum.TAX)], 'caption', true);

        expect(items.filter(item => item.kind === YieldListItemKindEnum.PAYOUT)).toMatchObject([{ id: 'payout-3', tax: null }]);
    })
);

it.effect('merges three or more payouts sharing a source and kind into one row', () =>
    Effect.sync(() => {
        const days = [10, 11, 12].map(day => new Date(`2026-10-${day}T12:00:00Z`));
        const items = buildYieldListItems(
            [],
            [...days.map((day, index) => payout(index + 1, null, day)), payout(9, null, new Date('2026-10-13T12:00:00Z'))].map(
                (item, index) => (index === 3 ? { ...item, title: 'Other' } : item)
            ),
            'caption',
            true
        );
        const payouts = items.filter(item => item.kind === YieldListItemKindEnum.PAYOUT);

        expect(payouts).toHaveLength(2);
        expect(payouts.at(0)).toMatchObject({ siblings: [{ id: 1 }, { id: 2 }, { id: 3 }] });
        expect(payouts.at(1)).toMatchObject({ siblings: [] });
    })
);
