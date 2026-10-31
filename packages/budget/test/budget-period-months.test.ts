import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { buildPeriodMonths } from '../src/period/utils/budget-period-months.util';

it.effect('returns the single month of a month-aligned window', () =>
    Effect.sync(() => {
        expect(buildPeriodMonths({ periodStart: new Date(2026, 10, 1), nextPeriodStart: new Date(2026, 11, 1) })).toEqual([
            new Date(2026, 10, 1)
        ]);
    })
);

it.effect('returns both months touched by a week crossing a month boundary', () =>
    Effect.sync(() => {
        expect(buildPeriodMonths({ periodStart: new Date(2026, 9, 26), nextPeriodStart: new Date(2026, 10, 2) })).toEqual([
            new Date(2026, 9, 1),
            new Date(2026, 10, 1)
        ]);
    })
);

it.effect('returns one month for a week that ends exactly on the next month start', () =>
    Effect.sync(() => {
        expect(buildPeriodMonths({ periodStart: new Date(2026, 10, 2), nextPeriodStart: new Date(2026, 10, 9) })).toEqual([
            new Date(2026, 10, 1)
        ]);
    })
);

it.effect('returns thirteen months for a yearly window that starts mid-month', () =>
    Effect.sync(() => {
        const months = buildPeriodMonths({ periodStart: new Date(2026, 2, 15), nextPeriodStart: new Date(2027, 2, 15) });

        expect(months).toHaveLength(13);
        expect(months[0]).toEqual(new Date(2026, 2, 1));
        expect(months[12]).toEqual(new Date(2027, 2, 1));
    })
);
