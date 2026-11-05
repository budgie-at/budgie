import { resetTestDb } from '@budgie-at/test-kit';
import {
    RecurringCadenceUnitEnum,
    RecurringMatchSourceEnum,
    RecurringSeriesKindEnum,
    RecurringSeriesSourceEnum,
    RecurringSeriesUserStateEnum
} from '@budgie/contracts';
import { afterAll, beforeEach, expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { RecurringService } from '../src/index';
import { RecurringRepository } from '../src/repository/recurring.repository';

import { DEFAULT_INSTRUMENT_ID, NOW, seedCharges, seedMonthlyCharges, seedSavedSeries } from './recurring-seed';
import { TestLayer, detectAt, findSeries, testDb, testDbHandle } from './test-context';

const SIX_MONTHS = [6, 5, 4, 3, 2, 1] as const;

const LEGACY_SCENARIOS = [
    [
        'adopts a dismissed pre-migration Cyrillic row without resurfacing it',
        'КИЇВСТАР',
        'EXPENSE|1|КИЇВСТАР',
        'Kyivstar',
        RecurringSeriesUserStateEnum.DISMISSED,
        'EXPENSE|1|KYIVSTAR|12000000'
    ],
    [
        'adopts a confirmed pre-migration processor-prefixed row and keeps its title',
        'PAYPAL *SPOTIFY',
        'EXPENSE|1|PAYPAL SPOTIFY',
        'Family music',
        RecurringSeriesUserStateEnum.CONFIRMED,
        'EXPENSE|1|SPOTIFY|12000000'
    ]
] as const;

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));

afterAll(() => testDbHandle.dispose());

layer(TestLayer)('recurring identity', it => {
    for (const [scenario, chargeTitle, legacyKey, title, userState, expectedKey] of LEGACY_SCENARIOS) {
        it.effect(scenario, () =>
            Effect.gen(function* () {
                const seed = yield* seedCharges();
                yield* seedMonthlyCharges(seed, chargeTitle, SIX_MONTHS, 5, 12);
                const legacy = yield* seedSavedSeries({
                    merchantKey: legacyKey,
                    title,
                    amount: 12_000_000,
                    userState,
                    lastSeenAt: new Date(2026, 0, 5)
                });

                yield* detectAt(NOW);
                const rows = yield* findSeries();

                expect(rows).toHaveLength(1);
                expect(rows[0]).toMatchObject({ id: legacy.id, title, userState, merchantKey: expectedKey });
            })
        );
    }

    it.effect('keeps a series edited to a different cadence instead of detecting a duplicate', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthlyCharges(seed, 'NETFLIX', SIX_MONTHS, 5, 12);
            const service = yield* RecurringService;
            yield* detectAt(NOW);
            const [detected] = yield* findSeries();
            yield* service.update(detected.id, { cadenceUnit: RecurringCadenceUnitEnum.WEEK, cadenceInterval: 4 });
            yield* (yield* RecurringRepository).updateSeries(detected.id, { merchantKey: 'EXPENSE|1|CUSTOM' });

            yield* detectAt(NOW);
            const rows = yield* findSeries();

            expect(rows.map(row => row.id)).toEqual([detected.id]);
        })
    );

    it.effect('does not detect a duplicate next to a manual series that covers the same charges', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const ids = yield* seedMonthlyCharges(seed, 'NETFLIX', SIX_MONTHS, 5, 12);
            const service = yield* RecurringService;
            const manual = yield* service.createManual({
                kind: RecurringSeriesKindEnum.EXPENSE,
                title: 'Streaming',
                amount: 12_000_000,
                instrumentId: DEFAULT_INSTRUMENT_ID,
                cadenceUnit: RecurringCadenceUnitEnum.WEEK,
                cadenceInterval: 4,
                anchorDate: new Date(2026, 5, 5)
            });
            yield* Effect.forEach(ids, transactionId => service.addTransaction(manual.id, transactionId), { discard: true });

            yield* detectAt(NOW);
            const rows = yield* findSeries();

            expect(rows.map(row => [row.id, row.source])).toEqual([[manual.id, RecurringSeriesSourceEnum.MANUAL]]);
        })
    );

    it.effect('creates no row for a second stream whose charges a manual series already owns', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const first = yield* seedMonthlyCharges(seed, 'APPLE', SIX_MONTHS, 5, 5);
            const second = yield* seedMonthlyCharges(seed, 'APPLE', SIX_MONTHS, 20, 15);
            const service = yield* RecurringService;
            const manual = yield* service.createManual({
                kind: RecurringSeriesKindEnum.EXPENSE,
                title: 'Apple',
                amount: 5_000_000,
                instrumentId: DEFAULT_INSTRUMENT_ID,
                cadenceUnit: RecurringCadenceUnitEnum.MONTH,
                cadenceInterval: 1,
                anchorDate: new Date(2026, 5, 5)
            });
            yield* Effect.forEach([...first, ...second], transactionId => service.addTransaction(manual.id, transactionId), {
                discard: true
            });

            yield* detectAt(NOW);
            const rows = yield* findSeries();
            const links = yield* (yield* RecurringRepository).findLinks();

            expect(rows.map(row => row.id)).toEqual([manual.id]);
            expect(links.every(link => link.seriesId === manual.id && link.matchedBy === RecurringMatchSourceEnum.USER)).toBe(true);
        })
    );
});
