import { PRECISION, RecurringSeriesKindEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { detectRecurringSeries } from '../src/series/recurring-series';
import { normalizeRecurringDescription } from '../src/utils/normalize-recurring-description.util';

import type { RecurringChargeInterface } from '../src/interface/recurring-charge.interface';

const charge = (day: number, title: string): RecurringChargeInterface => ({
    kind: RecurringSeriesKindEnum.EXPENSE,
    nativeAmount: 12 * PRECISION,
    instrumentId: 1,
    counterpartyIban: null,
    transactionId: day,
    operatedAt: new Date(2026, 0, day, 12),
    title,
    comment: '',
    defaultAmount: 12 * PRECISION,
    accountId: 1,
    categoryId: null,
    categoryTitle: null,
    categoryIcon: null
});

it.effect('strips payment processor prefixes before comparing merchant labels', () =>
    Effect.sync(() => {
        expect(normalizeRecurringDescription('PAYPAL *SPOTIFY')).toBe('SPOTIFY');
        expect(normalizeRecurringDescription('PAYPAL *SPOTIFY')).toBe(normalizeRecurringDescription('SPOTIFY'));
        expect(normalizeRecurringDescription('PP*NETFLIX')).toBe(normalizeRecurringDescription('NETFLIX'));
        expect(normalizeRecurringDescription('SQ *SPOTIFY')).toBe(normalizeRecurringDescription('SPOTIFY'));
        expect(normalizeRecurringDescription('SQU*SPOTIFY')).toBe(normalizeRecurringDescription('SPOTIFY'));
        expect(normalizeRecurringDescription('GOOGLE *YOUTUBE')).toBe(normalizeRecurringDescription('YOUTUBE'));
        expect(normalizeRecurringDescription('SUMUP *SHOP')).toBe(normalizeRecurringDescription('SHOP'));
        expect(normalizeRecurringDescription('SUMUP*SHOP')).toBe(normalizeRecurringDescription('SHOP'));
        expect(normalizeRecurringDescription('ZETTLE_*SHOP')).toBe(normalizeRecurringDescription('SHOP'));
        expect(normalizeRecurringDescription('IZ *SHOP')).toBe(normalizeRecurringDescription('SHOP'));
        expect(normalizeRecurringDescription('APPLE.COM/BILL')).toBe('APPLE COM BILL');
    })
);

it.effect('groups a processor-prefixed descriptor with the bare merchant during detection', () =>
    Effect.sync(() => {
        const charges = [5, 36, 64, 95].map((day, index) => charge(day, index % 2 === 0 ? 'PAYPAL *SPOTIFY' : 'SPOTIFY'));
        const series = detectRecurringSeries(charges);

        expect(series).toHaveLength(1);
        expect(series[0].events).toHaveLength(charges.length);
    })
);

it.effect('transliterates Cyrillic merchant names so both alphabets normalize to one label', () =>
    Effect.sync(() => {
        expect(normalizeRecurringDescription('Київстар')).toBe('KYIVSTAR');
        expect(normalizeRecurringDescription('Київстар')).toBe(normalizeRecurringDescription('Kyivstar'));
        expect(normalizeRecurringDescription('Нова Пошта')).toBe('NOVA POSHTA');
    })
);
