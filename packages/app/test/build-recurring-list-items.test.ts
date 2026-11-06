import {
    RecurringCadenceUnitEnum,
    RecurringSeriesKindEnum,
    RecurringSeriesSourceEnum,
    RecurringSeriesUserStateEnum
} from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { RECURRING_DUE_SOON_DAYS } from '../src/recurring/constant/recurring-due-soon-days.constant';
import { RecurringListItemKindEnum } from '../src/recurring/enum/recurring-list-item-kind.enum';
import { RecurringSectionEnum } from '../src/recurring/enum/recurring-section.enum';
import { buildRecurringListItems } from '../src/recurring/utils/build-recurring-list-items.util';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';
const series = (id: number, nextDate: Date | null): RecurringSeriesListItemInterface => ({
    id,
    nextDate,
    title: 'Bill',
    kind: RecurringSeriesKindEnum.EXPENSE,
    source: RecurringSeriesSourceEnum.MANUAL,
    userState: RecurringSeriesUserStateEnum.CONFIRMED,
    isActive: true,
    confidence: 100,
    cadenceUnit: RecurringCadenceUnitEnum.MONTH,
    cadenceInterval: 1,
    amount: 12,
    nativeAmount: 12,
    monthlyEquivalent: 12,
    alert: null,
    priceChange: null,
    categoryId: null,
    categoryTitle: null,
    categoryIcon: null,
    accountId: null,
    instrumentId: 1,
    endsAt: null,
    reminderDaysBefore: null,
    linkedCount: 0
});
it.effect('includes the seventh day in due soon and places missing dates later', () =>
    Effect.sync(() => {
        const items = buildRecurringListItems(
            [
                series(1, new Date(2026, 5, 15 + RECURRING_DUE_SOON_DAYS)),
                series(2, new Date(2026, 5, 16 + RECURRING_DUE_SOON_DAYS)),
                series(3, null)
            ],
            [],
            new Date(2026, 5, 15, 12)
        );
        expect(items.filter(item => item.type === RecurringListItemKindEnum.HEADER).map(item => [item.section, item.count])).toEqual([
            [RecurringSectionEnum.DUE_SOON, 1],
            [RecurringSectionEnum.THIS_MONTH, 1],
            [RecurringSectionEnum.LATER, 1]
        ]);
    })
);
