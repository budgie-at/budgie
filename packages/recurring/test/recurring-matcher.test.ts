import {
    RecurringSeriesSourceEnum,
    PRECISION,
    RecurringCadenceUnitEnum,
    RecurringSeriesKindEnum,
    RecurringSeriesUserStateEnum
} from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { matchRecurringTransactions } from '../src/series/recurring-matcher';

import type { RecurringChargeInterface } from '../src/interface/recurring-charge.interface';
import type { RecurringMatchSeriesInterface } from '../src/interface/recurring-match-series.interface';

const charge = (transactionId: number, date: Date, amount: number, title = 'NETFLIX', accountId = 1): RecurringChargeInterface => ({
    transactionId,
    operatedAt: date,
    title,
    comment: '',
    defaultAmount: amount * PRECISION,
    nativeAmount: amount * PRECISION,
    instrumentId: 1,
    counterpartyIban: null,
    kind: RecurringSeriesKindEnum.EXPENSE,
    accountId,
    categoryId: null,
    categoryTitle: null,
    categoryIcon: null
});

const entry = (
    id: number,
    overrides: Partial<RecurringMatchSeriesInterface['series']> = {},
    extras: Partial<Omit<RecurringMatchSeriesInterface, 'series'>> = {}
): RecurringMatchSeriesInterface => ({
    series: {
        source: RecurringSeriesSourceEnum.MANUAL,
        id,
        kind: RecurringSeriesKindEnum.EXPENSE,
        merchantKey: 'EXPENSE|1|NETFLIX',
        title: 'Streaming',
        accountId: null,
        userState: RecurringSeriesUserStateEnum.CONFIRMED,
        cadenceUnit: RecurringCadenceUnitEnum.MONTH,
        cadenceInterval: 1,
        anchorDate: new Date(2026, 4, 5),
        endsAt: null,
        defaultAmount: 12 * PRECISION,
        ...overrides
    },
    userIdentities: new Set(),
    occupiedCycles: new Set(),
    excludedTransactionIds: new Set(),
    ...extras
});

const June = (day: number) => new Date(2026, 5, day, 12);

it.effect('links a charge to the nearest cycle within tolerance and ignores charges outside it', () =>
    Effect.sync(() => {
        const matches = matchRecurringTransactions([charge(1, June(7), 12), charge(2, June(20), 12)], [entry(1)]);

        expect(matches.map(match => [match.seriesId, match.transactionId])).toEqual([[1, 1]]);
        expect(matches[0].cycleDate).toEqual(new Date(2026, 5, 5));
    })
);

it.effect('links nothing when the closest amounts tie across series', () =>
    Effect.sync(() => {
        const matches = matchRecurringTransactions(
            [charge(1, June(5), 15)],
            [entry(1, { defaultAmount: 10 * PRECISION }), entry(2, { defaultAmount: 20 * PRECISION })]
        );

        expect(matches).toEqual([]);
    })
);

it.effect('prefers the series with the closest amount', () =>
    Effect.sync(() => {
        const matches = matchRecurringTransactions(
            [charge(1, June(5), 18)],
            [entry(1, { defaultAmount: 10 * PRECISION }), entry(2, { defaultAmount: 20 * PRECISION })]
        );

        expect(matches.map(match => match.seriesId)).toEqual([2]);
    })
);

it.effect('leaves a charge unlinked when the closest series is dismissed', () =>
    Effect.sync(() => {
        const matches = matchRecurringTransactions(
            [charge(1, June(5), 18)],
            [
                entry(1, { defaultAmount: 10 * PRECISION }),
                entry(2, { defaultAmount: 20 * PRECISION, userState: RecurringSeriesUserStateEnum.DISMISSED })
            ]
        );

        expect(matches).toEqual([]);
    })
);

it.effect('links at most one charge per series cycle', () =>
    Effect.sync(() => {
        const twoInCycle = matchRecurringTransactions([charge(1, June(5), 12), charge(2, June(6), 30)], [entry(1)]);
        const occupied = matchRecurringTransactions(
            [charge(3, June(5), 12)],
            [entry(1, {}, { occupiedCycles: new Set([new Date(2026, 5, 5).getTime()]) })]
        );

        expect(twoInCycle.map(match => match.transactionId)).toEqual([1]);
        expect(occupied).toEqual([]);
    })
);

it.effect('respects excluded pairs, the account restriction and endsAt', () =>
    Effect.sync(() => {
        const excluded = matchRecurringTransactions([charge(1, June(5), 12)], [entry(1, {}, { excludedTransactionIds: new Set([1]) })]);
        const otherAccount = matchRecurringTransactions([charge(1, June(5), 12, 'NETFLIX', 2)], [entry(1, { accountId: 1 })]);
        const sameAccount = matchRecurringTransactions([charge(1, June(5), 12, 'NETFLIX', 2)], [entry(1, { accountId: 2 })]);
        const ended = matchRecurringTransactions([charge(1, June(5), 12)], [entry(1, { endsAt: new Date(2026, 4, 5) })]);

        expect(excluded).toEqual([]);
        expect(otherAccount).toEqual([]);
        expect(sameAccount).toHaveLength(1);
        expect(ended).toEqual([]);
    })
);

it.effect('matches an empty merchant key by title and learns the key from the first link', () =>
    Effect.sync(() => {
        const matches = matchRecurringTransactions(
            [charge(1, June(5), 12, 'NETFLIX.COM 866-579'), charge(2, new Date(2026, 6, 5, 12), 12, 'NETFLIX.COM 866-579')],
            [entry(1, { merchantKey: '', title: 'Netflix' })]
        );
        const unrelated = matchRecurringTransactions(
            [charge(3, June(5), 12, 'SPOTIFY')],
            [entry(1, { merchantKey: '', title: 'Netflix' })]
        );

        expect(matches.map(match => match.merchantKey)).toEqual(['EXPENSE|1|NETFLIX COM', null]);
        expect(unrelated).toEqual([]);
    })
);

it.effect('matches by the identity of a user-linked transaction', () =>
    Effect.sync(() => {
        const matches = matchRecurringTransactions(
            [charge(1, June(5), 12, 'NETFLIX INTERNATIONAL')],
            [entry(1, { merchantKey: 'EXPENSE|1|STREAMING' }, { userIdentities: new Set(['EXPENSE|1|NETFLIX INTERNATIONAL']) })]
        );

        expect(matches).toHaveLength(1);
    })
);

it.effect('applies custom cadence tolerance for every 5 weeks and every 4 months', () =>
    Effect.sync(() => {
        const fiveWeeks = entry(1, { cadenceUnit: RecurringCadenceUnitEnum.WEEK, cadenceInterval: 5, anchorDate: new Date(2026, 4, 1) });
        const fourMonths = entry(2, { cadenceUnit: RecurringCadenceUnitEnum.MONTH, cadenceInterval: 4, anchorDate: new Date(2026, 0, 10) });
        const fiveWeeksNear = matchRecurringTransactions([charge(1, new Date(2026, 5, 9, 12), 12)], [fiveWeeks]);
        const fiveWeeksFar = matchRecurringTransactions([charge(2, new Date(2026, 5, 10, 12), 12)], [fiveWeeks]);
        const fourMonthsNear = matchRecurringTransactions([charge(3, new Date(2026, 4, 18, 12), 12)], [fourMonths]);
        const fourMonthsFar = matchRecurringTransactions([charge(4, new Date(2026, 4, 19, 12), 12)], [fourMonths]);

        expect(fiveWeeksNear).toHaveLength(1);
        expect(fiveWeeksFar).toEqual([]);
        expect(fourMonthsNear).toHaveLength(1);
        expect(fourMonthsFar).toEqual([]);
    })
);

it.effect('rejects unrelated large purchases and substring titles', () =>
    Effect.sync(() => {
        expect(matchRecurringTransactions([charge(1, June(5), 200)], [entry(1)])).toEqual([]);
        expect(matchRecurringTransactions([charge(1, June(5), 12, 'PARENTS')], [entry(1, { title: 'RENT', merchantKey: '' })])).toEqual([]);
        expect(
            matchRecurringTransactions([charge(1, June(5), 12, 'RENT PAYMENT')], [entry(1, { title: 'RENT', merchantKey: '' })])
        ).toHaveLength(1);
    })
);
