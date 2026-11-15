import { resetTestDb } from '@budgie-at/test-kit';
import { Db, RecurringSeriesKindEnum, TransactionEntityTable, YieldKindEnum } from '@budgie/contracts';
import { beforeEach, expect, layer } from '@effect/vitest';
import { inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { NOW, TestLayer, detectAt, findSeries, seedCharges, testDb } from './test-context';

const SIX_MONTHS = [6, 5, 4, 3, 2, 1] as const;

const seedMonthlyIncome = (yieldKind: YieldKindEnum | null) =>
    Effect.gen(function* () {
        const seed = yield* seedCharges();
        const ids = yield* Effect.forEach(SIX_MONTHS, monthsAgo => seed('DEPOSIT INTEREST', monthsAgo, 1, 40, true));

        yield* Db.query(database =>
            database
                .update(TransactionEntityTable)
                .set({ yieldKind })
                .where(inArray(TransactionEntityTable.id, [...ids]))
        );
    });

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));

layer(TestLayer)('recurring yield income', it => {
    it.effect('does not turn yield income into an income series', () =>
        Effect.gen(function* () {
            yield* seedMonthlyIncome(YieldKindEnum.INTEREST);
            yield* detectAt(NOW);

            expect(yield* findSeries(RecurringSeriesKindEnum.INCOME)).toEqual([]);
        })
    );

    it.effect('still detects income the user marked as not passive income', () =>
        Effect.gen(function* () {
            yield* seedMonthlyIncome(YieldKindEnum.NONE);
            yield* detectAt(NOW);

            expect(yield* findSeries(RecurringSeriesKindEnum.INCOME)).toHaveLength(1);
        })
    );

    it.effect('still detects income with no yield kind', () =>
        Effect.gen(function* () {
            yield* seedMonthlyIncome(null);
            yield* detectAt(NOW);

            expect(yield* findSeries(RecurringSeriesKindEnum.INCOME)).toHaveLength(1);
        })
    );
});
