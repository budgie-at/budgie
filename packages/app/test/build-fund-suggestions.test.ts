import { RecurringSeriesKindEnum, RecurringSeriesStatusEnum, RecurringSeriesUserStateEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { buildFundSuggestions } from '../src/budget/utils/build-fund-suggestions.util';

import type { RecurringSeriesEntityInterface } from '@budgie/contracts';

const NOW = new Date(2026, 9, 29, 12);

const seriesOf = (overrides: Partial<RecurringSeriesEntityInterface>): RecurringSeriesEntityInterface => ({
    id: 1,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    merchantKey: 'insurance',
    kind: RecurringSeriesKindEnum.EXPENSE,
    periodDays: 365,
    amount: 900,
    status: RecurringSeriesStatusEnum.ACTIVE,
    userState: RecurringSeriesUserStateEnum.CONFIRMED,
    title: 'Car insurance',
    categoryId: 7,
    lastSeenAt: new Date(2026, 2, 14),
    ...overrides
});

it.effect('suggests a yearly series with the next due date and a 12 month repeat', () =>
    Effect.sync(() => {
        const [suggestion] = buildFundSuggestions([seriesOf({})], [], 2, NOW);

        expect(suggestion).toEqual({
            recurringSeriesId: 1,
            name: 'Car insurance',
            categoryId: 7,
            targetAmount: 1800,
            dueAt: new Date(2027, 2, 14),
            repeatEveryMonths: 12
        });
    })
);

it.effect('suggests a half-yearly series with a 6 month repeat', () =>
    Effect.sync(() => {
        const [suggestion] = buildFundSuggestions([seriesOf({ periodDays: 182, lastSeenAt: new Date(2026, 6, 1) })], [], 1, NOW);

        expect(suggestion.repeatEveryMonths).toBe(6);
        expect(suggestion.dueAt).toEqual(new Date(2026, 11, 30));
    })
);

it.effect('skips monthly series, dismissed series, uncategorised series, income and already linked series', () =>
    Effect.sync(() => {
        const skipped = [
            seriesOf({ id: 2, periodDays: 30 }),
            seriesOf({ id: 3, userState: RecurringSeriesUserStateEnum.DISMISSED }),
            seriesOf({ id: 4, categoryId: null }),
            seriesOf({ id: 5, kind: RecurringSeriesKindEnum.INCOME }),
            seriesOf({ id: 6, status: RecurringSeriesStatusEnum.ENDED }),
            seriesOf({ id: 7 })
        ];

        expect(buildFundSuggestions(skipped, [7], 1, NOW)).toEqual([]);
    })
);

it.effect('sorts suggestions by the nearest due date', () =>
    Effect.sync(() => {
        const suggestions = buildFundSuggestions(
            [seriesOf({ id: 1 }), seriesOf({ id: 2, title: 'Tax', lastSeenAt: new Date(2026, 0, 10) })],
            [],
            1,
            NOW
        );

        expect(suggestions.map(suggestion => suggestion.recurringSeriesId)).toEqual([2, 1]);
    })
);
