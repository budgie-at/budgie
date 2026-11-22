import { AccountTypeEnum, InstrumentTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { YieldPositionSectionEnum } from '@budgie/market';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TransactionListRowPositionEnum } from '../src/transaction/enum/transaction-list-row-position.enum';
import { YieldListItemKindEnum } from '../src/yield/enum/yield-list-item-kind.enum';
import { YieldListSectionEnum } from '../src/yield/enum/yield-list-section.enum';
import { YieldPayoutDateFormatEnum } from '../src/yield/enum/yield-payout-date-format.enum';
import { buildYieldListItems } from '../src/yield/utils/build-yield-list-items.util';

import { buildAccountWithInstrument } from './fixture/account-with-instrument';
import { buildPrimaryEntry } from './fixture/transaction-entry';
import { buildTransaction } from './fixture/transaction-with-relations';

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
    kind: null,
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

const payout = (id: number, yieldKind: YieldKindEnum | null = null, operatedAt = TIMESTAMP): TransactionWithRelationsEntityInterface =>
    buildTransaction({ id, yieldKind, operatedAt });

it.effect('lists active, closed and unassigned sections in order', () =>
    Effect.sync(() => {
        const items = buildYieldListItems(
            [position(1, YieldPositionSectionEnum.CLOSED), position(2, YieldPositionSectionEnum.ACTIVE)],
            [],
            'since 1 Nov',
            [payout(9)]
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
        expect(buildYieldListItems([], [], 'caption', [])).toEqual([]);
        expect(buildYieldListItems([position(1, YieldPositionSectionEnum.ACTIVE)], [], 'caption', []).map(item => item.id)).toEqual([
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
            null
        );

        expect(items.map(item => item.kind)).toEqual([
            YieldListItemKindEnum.SECTION,
            YieldListItemKindEnum.MONTH,
            YieldListItemKindEnum.PAYOUT,
            YieldListItemKindEnum.PAYOUT,
            YieldListItemKindEnum.MONTH,
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
        expect(buildYieldListItems([position(1, YieldPositionSectionEnum.ACTIVE)], [], 'caption', null)).toEqual([]);
    })
);

it.effect('keeps unmatched tax as its own row', () =>
    Effect.sync(() => {
        const items = buildYieldListItems([], [payout(3, YieldKindEnum.TAX)], 'caption', null);

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
            null
        );
        const payouts = items.filter(item => item.kind === YieldListItemKindEnum.PAYOUT);

        expect(payouts).toHaveLength(2);
        expect(payouts.at(0)).toMatchObject({ siblings: [] });
        expect(payouts.at(1)).toMatchObject({ siblings: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    })
);

it.effect('drops month headers and dates rows in full when every month has one row', () =>
    Effect.sync(() => {
        const items = buildYieldListItems(
            [],
            [payout(1, null, new Date('2026-10-10T12:00:00Z')), payout(2, null, new Date('2026-09-20T12:00:00Z'))],
            'caption',
            null
        );

        expect(items.map(item => item.kind)).toEqual([
            YieldListItemKindEnum.SECTION,
            YieldListItemKindEnum.PAYOUT,
            YieldListItemKindEnum.PAYOUT
        ]);
        expect(items.slice(1)).toMatchObject([
            { dateFormat: YieldPayoutDateFormatEnum.DAY_MONTH_YEAR, position: TransactionListRowPositionEnum.FIRST },
            { dateFormat: YieldPayoutDateFormatEnum.DAY_MONTH_YEAR, position: TransactionListRowPositionEnum.LAST }
        ]);
    })
);

it.effect('keeps month headers without a total for single-row months beside a busier month', () =>
    Effect.sync(() => {
        const october = new Date('2026-10-10T12:00:00Z');
        const busy = [payout(1, null, october), payout(2, null, october), payout(3, null, new Date('2026-09-20T12:00:00Z'))];
        const items = buildYieldListItems([], busy, 'caption', null);

        const hasTotals = items.flatMap(item => (item.kind === YieldListItemKindEnum.MONTH ? [item.total !== null] : []));

        expect(hasTotals).toEqual([true, false]);
    })
);

it.effect.each([
    { yieldKind: YieldKindEnum.TAX, hasTax: true },
    { yieldKind: null, hasTax: false }
])('flags the payouts section hasTax=$hasTax for a payout of kind $yieldKind', ({ yieldKind, hasTax }) =>
    Effect.sync(() => {
        expect(buildYieldListItems([], [payout(1, yieldKind)], 'caption', null).at(0)).toMatchObject({ hasTax });
    })
);

it.effect('lists assigned payouts under their own section when unfiltered', () =>
    Effect.sync(() => {
        const items = buildYieldListItems([position(1, YieldPositionSectionEnum.ACTIVE)], [payout(1), payout(2)], 'caption', [payout(2)]);

        expect(items.filter(item => item.kind === YieldListItemKindEnum.SECTION).map(item => item.id)).toEqual([
            `section-${YieldListSectionEnum.ACTIVE}`,
            `section-${YieldListSectionEnum.UNASSIGNED}`,
            `section-${YieldListSectionEnum.PAYOUTS}`
        ]);
        expect(items.at(-1)).toMatchObject({ id: 'payout-1', isUnassigned: false });
    })
);

it.effect('sorts rows newest first by their last payout date, merged rows included', () =>
    Effect.sync(() => {
        const merged = [1, 2, 3].map(index => payout(index, null, new Date(`2026-10-0${index}T12:00:00Z`)));
        const single = { ...payout(9, null, new Date('2026-10-02T18:00:00Z')), title: 'Other' };
        const items = buildYieldListItems([], [...merged, single], 'caption', null);
        const payouts = items.filter(item => item.kind === YieldListItemKindEnum.PAYOUT);

        expect(payouts.map(item => item.id)).toEqual(['payout-1', 'payout-9']);
        expect(payouts.at(0)).toMatchObject({ siblings: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    })
);

const PAYOUT_ACCOUNT = buildAccountWithInstrument(5, AccountTypeEnum.DEPOSIT, 'Deposit');

const smallPayout = (id: number, operatedAt: Date): TransactionWithRelationsEntityInterface => ({
    ...payout(id, null, operatedAt),
    title: `Payout ${id}`,
    toAccount: PAYOUT_ACCOUNT,
    entries: [buildPrimaryEntry({ id, accountId: PAYOUT_ACCOUNT.id, account: PAYOUT_ACCOUNT })]
});

it.effect('keeps cents in the month total instead of rounding each payout', () =>
    Effect.sync(() => {
        const items = buildYieldListItems(
            [],
            [
                smallPayout(1, new Date('2026-10-10T12:00:00Z')),
                smallPayout(2, new Date('2026-10-11T12:00:00Z')),
                smallPayout(3, new Date('2026-10-12T12:00:00Z')),
                smallPayout(4, new Date('2026-09-12T12:00:00Z')),
                smallPayout(5, new Date('2026-09-13T12:00:00Z'))
            ],
            'caption',
            null
        );
        const totals = items.flatMap(item => (item.kind === YieldListItemKindEnum.MONTH ? [item.total] : []));

        expect(totals[0]).toBeCloseTo(1.2, 9);
        expect(totals[1]).toBeCloseTo(0.8, 9);
    })
);
