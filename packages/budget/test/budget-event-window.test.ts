import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { computeEventWindow } from '../src/period/utils/budget-event-window.util';

it.effect('covers the start day through the whole inclusive end day', () =>
    Effect.sync(() => {
        const window = computeEventWindow({ startsAt: new Date(2026, 5, 10, 15, 30), endsAt: new Date(2026, 5, 14, 9) });

        expect(window.periodStart).toEqual(new Date(2026, 5, 10));
        expect(window.nextPeriodStart).toEqual(new Date(2026, 5, 15));
    })
);

it.effect('covers a single-day event', () =>
    Effect.sync(() => {
        const window = computeEventWindow({ startsAt: new Date(2026, 5, 10), endsAt: new Date(2026, 5, 10) });

        expect(window.nextPeriodStart).toEqual(new Date(2026, 5, 11));
    })
);

it.effect('stays on local midnight when the event spans the autumn DST change', () =>
    Effect.sync(() => {
        const window = computeEventWindow({ startsAt: new Date(2026, 9, 24), endsAt: new Date(2026, 9, 25) });

        expect(window.nextPeriodStart).toEqual(new Date(2026, 9, 26));
        expect(window.nextPeriodStart.getHours()).toBe(0);
    })
);
