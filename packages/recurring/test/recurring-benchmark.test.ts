import { PRECISION, RecurringSeriesKindEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { RECURRING_ACTIVE_CONFIDENCE } from '../src/constant/recurring-active-confidence.constant';
import { detectRecurringSeries, isSeriesActive } from '../src/series/recurring-series';

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

const describeSeries = (series: RecurringSeriesInterface): string =>
    [
        series.confidence >= RECURRING_ACTIVE_CONFIDENCE ? 'active' : 'possible',
        series.periodMonths === null ? `every ${series.periodDays} days` : CADENCE_NAMES[series.periodMonths],
        ...(isSeriesActive(series, NOW) ? [] : ['ended'])
    ].join(' ');

const CASES: readonly (readonly [string, readonly RecurringChargeInterface[], readonly string[]])[] = [
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
    ]
];

for (const [name, charges, expected] of CASES) {
    it.effect(name, () =>
        Effect.sync(() => {
            expect(detectRecurringSeries(charges).map(describeSeries)).toEqual(expected);
        })
    );
}
