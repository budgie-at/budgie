import { PRECISION, RecurringSeriesKindEnum, RecurringSeriesUserStateEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import { startOfDay } from 'date-fns/startOfDay';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { RECURRING_ACTIVE_CONFIDENCE } from '../src/constant/recurring-active-confidence.constant';
import { RecurringAlertEnum } from '../src/enum/recurring-alert.enum';
import { resolveRecurringAlert } from '../src/series/recurring-alert';
import { detectRecurringSeries, isSeriesActive } from '../src/series/recurring-series';

import { buildReadModels } from './test-models';

import type { RecurringChargeInterface } from '../src/interface/recurring-charge.interface';
import type { RecurringSeriesInterface } from '../src/interface/recurring-series.interface';

const NOW = new Date(2026, 10, 19, 12);
const CADENCE_NAMES: Record<number, string> = { 1: 'monthly', 2: 'bimonthly', 3: 'quarterly', 6: 'semiannual', 12: 'yearly' };

let nextTransactionId = 1;

const charge = (
    operatedAt: Date,
    amount: number,
    title: string,
    kind: RecurringSeriesKindEnum = RecurringSeriesKindEnum.EXPENSE
): RecurringChargeInterface => ({
    kind,
    nativeAmount: Math.round(amount * PRECISION),
    instrumentId: 1,
    counterpartyIban: null,
    transactionId: (nextTransactionId += 1),
    operatedAt,
    title,
    comment: '',
    defaultAmount: Math.round(amount * PRECISION),
    accountId: 1,
    categoryId: null
});

const monthDay = (monthsAgo: number, day: number): Date => new Date(NOW.getFullYear(), NOW.getMonth() - monthsAgo, day, 12);
const daysAgo = (days: number): Date => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - days, 12);

const monthly = (title: string, days: readonly number[], amounts: readonly number[], lastMonthsAgo = 0) =>
    days.map((day, index) => charge(monthDay(lastMonthsAgo + days.length - 1 - index, day), amounts[index % amounts.length], title));

const quarterly = (title: string, count: number, day: number, amounts: readonly number[], lastMonthsAgo = 0) =>
    Array.from({ length: count }, (_, index) =>
        charge(monthDay(lastMonthsAgo + (count - 1 - index) * 3, day), amounts[index % amounts.length], title)
    );

const pseudoRandom = (seed: number) => {
    let state = seed;

    return (): number => {
        state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;

        return state / 2_147_483_648;
    };
};

const shopVisits = (title: string, count: number, minimum: number, maximum: number, spanDays: number) => {
    const random = pseudoRandom(count * 31 + spanDays);

    return Array.from({ length: count }, () =>
        charge(daysAgo(Math.floor(random() * spanDays)), Math.round((minimum + random() * (maximum - minimum)) * 100) / 100, title)
    );
};

const cumulativeVisits = (title: string, gaps: readonly number[], amounts: readonly number[]) =>
    gaps.map((_, index) =>
        charge(daysAgo(gaps.slice(index).reduce((total, gap) => total + gap, 0)), amounts[index % amounts.length], title)
    );

const withIban = (charges: readonly RecurringChargeInterface[], iban: string) => charges.map(item => ({ ...item, counterpartyIban: iban }));

const asIncome = (charges: readonly RecurringChargeInterface[]) => charges.map(item => ({ ...item, kind: RecurringSeriesKindEnum.INCOME }));

const describeSeries = (series: RecurringSeriesInterface, charges: readonly RecurringChargeInterface[]): string =>
    [
        series.confidence >= RECURRING_ACTIVE_CONFIDENCE ? 'active' : 'possible',
        series.periodMonths === null ? `every ${series.periodDays} days` : CADENCE_NAMES[series.periodMonths],
        ...(isSeriesActive(series, NOW) ? [] : ['ended']),
        ...buildReadModels([series], charges, RecurringSeriesUserStateEnum.CONFIRMED)
            .map(model => resolveRecurringAlert(model, NOW))
            .filter(alert => alert === RecurringAlertEnum.OVERDUE)
            .map(alert => alert.toLowerCase())
    ].join(' ');

const CASES: readonly (readonly [
    string,
    readonly RecurringChargeInterface[],
    readonly string[],
    (readonly number[])?,
    (readonly Date[])?
])[] = [
    [
        'drugstore habit with seventeen irregular visits is not recurring',
        cumulativeVisits(
            'DRUGSTORE ALPHA',
            [4, 37, 12, 176, 9, 61, 23, 88, 5, 30, 140, 18, 45, 7, 66, 29, 3],
            [12.4, 7.9, 23.1, 5.5, 16.8, 9.2, 31, 11.3, 6.7, 19.9, 14.2, 8.8, 27.5, 10.1, 13.6, 21.4, 7.3]
        ),
        []
    ],
    [
        'bakery with eight small visits is not recurring',
        cumulativeVisits('BAKERY CRUMB', [151, 40, 210, 95, 160, 33, 120, 12], [2.6, 5.6, 12.8, 3.4, 7.9, 4.1, 9.5, 6.2]),
        []
    ],
    [
        'restaurant visited about every six months with different bills is not recurring',
        cumulativeVisits('RESTAURANT PAMPA', [200, 168, 197, 171, 20], [85, 120, 64, 135, 98]),
        []
    ],
    [
        'three ticket purchases about six months apart are not recurring',
        cumulativeVisits('TICKETS ROUTE', [305, 175, 15], [86, 89, 31]),
        []
    ],
    [
        'daily interest income is not recurring',
        Array.from({ length: 60 }, (_, index) =>
            charge(daysAgo(index), 0.05 + (index % 7) * 0.05, 'BANK INTEREST', RecurringSeriesKindEnum.INCOME)
        ),
        []
    ],
    [
        'twice a week fixed transfers to a friend are not recurring',
        Array.from({ length: 40 }, (_, index) => charge(daysAgo(Math.floor(index / 2) * 7 + (index % 2) * 3), 30, 'FRIEND ANNA')),
        []
    ],
    [
        'rent with an exact amount and a day drifting between the 4th and the 12th is monthly',
        monthly('RENT HOUSE', [4, 12, 8, 6, 11, 5, 9, 12, 4, 7, 10, 8], [2621]),
        ['active monthly']
    ],
    [
        'salary on the 25th shifted around weekends is monthly income',
        [25, 24, 25, 27, 25, 26, 23, 25, 25, 24, 27, 25].map((day, index) =>
            charge(monthDay(12 - index, day), 2495.55, 'EMPLOYER SALARY', RecurringSeriesKindEnum.INCOME)
        ),
        ['active monthly']
    ],
    [
        'monthly donation with a variable amount on the 3rd to the 5th is monthly',
        monthly(
            'CHARITY FUND',
            [3, 5, 3, 3, 4, 3, 3, 3, 4, 5, 4, 3, 4, 5, 4, 3, 3, 3, 5, 4],
            [2.76, 57, 298, 231, 183, 256, 33, 385, 273, 131, 13, 384, 186, 64, 0.21, 29, 67, 197, 385, 178]
        ),
        ['active monthly']
    ],
    [
        'quarterly account fee of about 20 is quarterly',
        quarterly('ACCOUNT FEE', 8, 30, [19.92, 19.92, 19.92, 20.5, 20.5, 20.5, 20.5, 21.24]),
        ['active quarterly']
    ],
    [
        'quarterly metered bill between 377 and 426 is quarterly',
        quarterly('POWER UTILITY', 6, 22, [426, 426, 402, 377, 377, 395]),
        ['active quarterly']
    ],
    [
        'two interleaved quarterly bills of one utility are two quarterly streams',
        [...quarterly('CITY ENERGY', 6, 24, [535, 531, 538]), ...quarterly('CITY ENERGY', 6, 22, [401, 398, 405], 1)],
        ['active quarterly', 'active quarterly']
    ],
    [
        'monthly subscription with one missed month stays monthly',
        [11, 10, 9, 8, 7, 5, 4, 3, 2, 1, 0].map(monthsAgo => charge(monthDay(monthsAgo, 12), 12.99, 'STREAMING ONE')),
        ['active monthly']
    ],
    [
        'monthly subscription hidden among two hundred other charges of the same merchant is monthly',
        [
            ...Array.from({ length: 12 }, (_, index) => charge(monthDay(index, 15), 9.99, 'MEGASTORE')),
            ...shopVisits('MEGASTORE', 200, 15, 150, 360)
        ],
        ['active monthly']
    ],
    [
        'exact yearly pair is yearly',
        [charge(monthDay(12, 12), 69.99, 'GAME NETWORK'), charge(monthDay(0, 12), 69.99, 'GAME NETWORK')],
        ['active yearly']
    ],
    [
        'yearly pair with a 16 percent amount difference is not active',
        [charge(monthDay(12, 15), 128, 'CLINIC NORTH'), charge(monthDay(0, 16), 148.65, 'CLINIC NORTH')],
        []
    ],
    [
        'yearly pair nine days apart in day of year is at most possible',
        [charge(monthDay(12, 3), 80, 'TREE MARKET'), charge(monthDay(0, 12), 80, 'TREE MARKET')],
        ['possible yearly']
    ],
    [
        'utility with a second meter and a settlement bill keeps a three-bill quarterly stream after a price change',
        [
            ...quarterly('CITY POWER', 2, 21, [702], 9),
            ...quarterly('CITY POWER', 3, 27, [535]),
            ...quarterly('CITY POWER', 2, 22, [377], 2),
            charge(monthDay(5, 5), 773.29, 'CITY POWER'),
            charge(monthDay(5, 5), 206.72, 'CITY POWER')
        ],
        ['active quarterly']
    ],
    ['quarterly charge of 0.06 is not a bill', quarterly('CAPITAL TAX', 8, 30, [0.06]), []],
    ['three exact monthly charges are active through exactness', monthly('CLOUD DRIVE', [7, 7, 7], [4.99]), ['active monthly']],
    [
        'three monthly charges with an 8 percent spread and no IBAN are possible',
        monthly('PHONE PLAN', [9, 9, 9], [20, 21.6, 20.8]),
        ['possible monthly']
    ],
    [
        'four identical monthly charges with the last one dated ahead are monthly',
        monthly('RENT FIXTURE', [19, 19, 19, 19], [120], -1),
        ['active monthly']
    ],
    ['four identical monthly charges ending last month are monthly', monthly('GYM FIXTURE', [24, 24, 24, 24], [25], 1), ['active monthly']],
    [
        'commitment that ended five months ago is emitted as ended',
        monthly('LANGUAGE SCHOOL', [6, 6, 6, 6, 6, 6, 6, 6], [120], 5),
        ['active monthly ended']
    ],
    [
        'price change of 26 percent mid stream keeps only the current price stream',
        monthly('TRANSIT PASS', [5, 6, 4, 6, 5, 7, 5, 6, 4, 6, 5], [33, 33, 33, 33, 33, 33, 41.7, 41.7, 41.7, 41.7, 41.7]),
        ['active monthly']
    ],
    [
        'old title-only feed continued by the same title with an IBAN is one monthly stream',
        [
            ...monthly('ACME PROPERTY GMBH', [5, 5, 5, 5, 5, 5, 5, 5], [950], 2),
            ...withIban(monthly('ACME PROPERTY GMBH', [5, 5], [950]), 'AT110000000000000001')
        ],
        ['active monthly']
    ],
    [
        'truncated company suffix continued by the full suffix with an IBAN is one monthly stream',
        [
            ...monthly('NORDPARK GARAGEN GMBH & CO K', [1, 1, 1, 1, 1, 1, 1], [208], 1),
            ...withIban(monthly('NORDPARK GARAGEN GMBH & CO KG', [2], [208]), 'AT110000000000000002')
        ],
        ['active monthly']
    ],
    [
        'salary whose title dropped its reference word is one monthly income',
        asIncome([
            ...monthly('EMPLOYER GMBH GEHALT', [25, 24, 25, 27, 25, 26, 23, 25, 25], [2495.55], 2),
            ...monthly('EMPLOYER GMBH', [23], [2495.55], 1)
        ]),
        ['active monthly']
    ],
    [
        'single token title does not merge with a longer title',
        [...monthly('STREAMCO', [3, 3, 3, 3, 3, 3], [9.99], 2), ...monthly('STREAMCO PLUS', [3, 3], [9.99])],
        ['active monthly ended']
    ],
    [
        'generic title shared by five IBANs does not merge payees',
        ['01', '02', '03', '04', '05'].flatMap((suffix, index) =>
            withIban([charge(monthDay(index, 10), 50, 'TRANSFER PAYMENT')], `AT1200000000000000${suffix}`)
        ),
        []
    ],
    [
        'institution that rotated its IBAN keeps one monthly stream',
        [
            ...withIban(monthly('CITY INSURANCE AG', [1, 1, 1, 1, 1, 1], [39.33], 2), 'AT130000000000000001'),
            ...withIban(monthly('CITY INSURANCE AG', [1, 1], [39.33]), 'AT130000000000000002')
        ],
        ['active monthly']
    ],
    [
        'rent income wandering over the 7th to the 17th for ten months is monthly',
        asIncome(monthly('TENANT PAYMENT', [7, 15, 11, 17, 9, 13, 8, 16, 12, 10], [1527])),
        ['active monthly']
    ],
    [
        'rent income wandering over the 7th to the 17th for four months is not active',
        asIncome(monthly('TENANT PAYMENT', [7, 15, 11, 17], [1527])),
        []
    ],
    [
        'three visits about six months apart with one two weeks off schedule are not a series',
        [
            charge(monthDay(16, 3), 2128.64, 'FOOD COURIER'),
            charge(monthDay(10, 18), 2303.09, 'FOOD COURIER'),
            charge(monthDay(4, 5), 2323.51, 'FOOD COURIER')
        ],
        []
    ],
    [
        'three charges about two months apart with one a week off schedule are not a series',
        [
            charge(monthDay(4, 12), 47.1, 'CLOUD HOSTING'),
            charge(monthDay(2, 12), 46.7, 'CLOUD HOSTING'),
            charge(monthDay(0, 19), 47.13, 'CLOUD HOSTING')
        ],
        []
    ],
    [
        'weekly payments jittering by two days are not recurring',
        [0, 2, -2, 1, -1, 2, 0, -2, 1, 2, -1, 0, 2, -2, 1, -2].map((jitter, index) =>
            charge(daysAgo(index * 7 + jitter + 3), 25, 'CLEANER MARIA')
        ),
        []
    ],
    [
        'two weekly payments jittering by three days are not recurring',
        [0, 3, -3, 2, -2, 3, 0, -3, 2, 3, -2, 0].map((jitter, index) => charge(daysAgo(index * 14 + jitter + 4), 40, 'TUTOR OLGA')),
        []
    ],
    [
        'step price change with one candidate per cycle continues one stream at the new price',
        monthly('MEDIA STORE', [9, 10, 8, 10, 10, 9, 10, 8], [335.87, 335.87, 335.87, 335.87, 337.39, 335.87, 382.43, 391.24]),
        ['active monthly'],
        [387]
    ],
    [
        'one off combined charge on schedule continues the stream at the usual price',
        monthly('HOSTING INC', [10, 10, 12, 10, 11, 10, 11], [18.02, 18.22, 18.14, 18.06, 19.46, 18.22, 35.19]),
        ['active monthly'],
        [19]
    ],
    [
        'persistent drop to half the amount continues one quarterly stream at the new amount',
        asIncome(quarterly('BANK BONUS', 7, 28, [4.1, 4.1, 4.1, 4.1, 4.1, 2.12, 2.12])),
        ['active quarterly'],
        [2]
    ],
    [
        'two IBANs charging at the same time under one shared title stay two monthly streams',
        [
            ...withIban(monthly('SEPA DIRECT DEBIT', [5, 5, 5, 5, 5, 5, 5, 5], [100]), 'AT140000000000000001'),
            ...withIban(monthly('SEPA DIRECT DEBIT', [15, 15, 15, 15, 15, 15, 15, 15], [100]), 'AT140000000000000002')
        ],
        ['active monthly', 'active monthly']
    ],
    [
        'yearly pair with an IBAN nine days apart in day of year is at most possible',
        withIban([charge(monthDay(12, 3), 80, 'TREE MARKET'), charge(monthDay(0, 12), 80, 'TREE MARKET')], 'AT150000000000000001'),
        ['possible yearly']
    ],
    [
        'exact yearly pair with an IBAN is yearly',
        withIban([charge(monthDay(12, 12), 69.99, 'GAME NETWORK'), charge(monthDay(0, 12), 69.99, 'GAME NETWORK')], 'AT150000000000000002'),
        ['active yearly']
    ],
    [
        'rent paid on the 8th for ten months and then eleven days late stays monthly until its last on-time payment',
        [...monthly('RENT TOWER', [8, 8, 8, 8, 8, 8, 8, 8, 8, 8], [800], 1), charge(monthDay(0, 19), 800, 'RENT TOWER')],
        ['active monthly overdue'],
        [800],
        [monthDay(1, 8)]
    ],
    [
        'rent paid once late continues with the next on-time payment',
        [
            ...monthly('RENT TOWER', [8, 8, 8, 8, 8, 8, 8, 8, 8, 8], [800], 2),
            charge(monthDay(1, 19), 800, 'RENT TOWER'),
            charge(monthDay(0, 8), 800, 'RENT TOWER')
        ],
        ['active monthly'],
        [800],
        [monthDay(0, 8)]
    ],
    [
        'four on-time rent payments and a fifth twelve days late are not an active series yet',
        [...monthly('RENT TOWER', [8, 8, 8, 8], [800], 2), charge(monthDay(1, 20), 800, 'RENT TOWER')],
        []
    ],
    [
        'four on-time rent payments, one twelve days late and two more on time are active',
        [
            ...monthly('RENT TOWER', [8, 8, 8, 8], [800], 3),
            charge(monthDay(2, 20), 800, 'RENT TOWER'),
            charge(monthDay(1, 8), 800, 'RENT TOWER'),
            charge(monthDay(0, 8), 800, 'RENT TOWER')
        ],
        ['active monthly']
    ],
    [
        'busy payee with two candidates per cycle does not continue an ended subscription',
        [
            ...monthly('SUPERSTORE', [15, 15, 15, 15, 15, 15], [9.99], 3),
            ...[
                [2, 13, 12.5],
                [2, 17, 8.4],
                [1, 14, 11],
                [1, 16, 15.3],
                [0, 13, 9.1],
                [0, 16, 13.2]
            ].map(([monthsAgo, day, amount]) => charge(monthDay(monthsAgo, day), amount, 'SUPERSTORE'))
        ],
        ['active monthly ended']
    ]
];

for (const [name, charges, expected, amounts, lastSeen] of CASES) {
    it.effect(name, () =>
        Effect.sync(() => {
            const detected = detectRecurringSeries(charges);

            expect(detected.map(series => describeSeries(series, charges))).toEqual(expected);
            if (isDefined(amounts)) {
                expect(detected.map(series => Math.round(series.nativeAmount / PRECISION))).toEqual(amounts);
            }
            if (isDefined(lastSeen)) {
                expect(detected.map(series => series.lastSeenTimestamp)).toEqual(lastSeen.map(date => startOfDay(date).getTime()));
            }
        })
    );
}
