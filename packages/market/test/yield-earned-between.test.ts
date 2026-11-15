import { CurrencyEnum, TransactionEntityTable, YieldKindEnum, YieldRepository } from '@budgie/contracts';
import { afterEach, beforeEach, expect, it, vi } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { YieldService } from '../src/yield/service/yield.service';
import { formatYieldDay } from '../src/yield/utils/format-yield-day.util';

import { requireInstrumentByCode, TestLayer, testDb, testSeedService } from './test-context';

beforeEach(() => {
    vi.stubEnv('TZ', 'Europe/Kyiv');
});

afterEach(() => {
    vi.unstubAllEnvs();
});

it.effect('matches the all-history local-day total with a bounded database query across midnight and DST', () =>
    Effect.gen(function* () {
        const euro = yield* requireInstrumentByCode(CurrencyEnum.EUR);
        const account = yield* testSeedService.account({ instrumentId: euro.id });

        for (const operatedAt of [
            new Date(2026, 2, 28, 23, 59, 59),
            new Date(2026, 2, 29),
            new Date(2026, 2, 29, 23, 59, 59),
            new Date(2026, 2, 30)
        ]) {
            const { transaction } = yield* testSeedService.valuedIncome({
                accountId: account.id,
                amount: 1_000_000,
                operatedAt,
                title: 'Interest',
                baseInstrumentId: euro.id,
                baseExchangeRate: 1,
                baseAmount: 1_000_000
            });

            yield* testDb
                .update(TransactionEntityTable)
                .set({ yieldKind: YieldKindEnum.INTEREST })
                .where(eq(TransactionEntityTable.id, transaction.id));
        }

        const repository = yield* YieldRepository;
        const scope = { positionAccountId: null, instrumentId: null };
        const allFacts = yield* repository.findFacts(scope, euro.id);
        const boundedFacts = yield* repository.findFacts(scope, euro.id, { from: new Date(2026, 2, 29), to: new Date(2026, 2, 30) });
        const expected = allFacts.filter(fact => formatYieldDay(fact.operatedAt) === '2026-03-29');

        expect(boundedFacts).toEqual(expected);
        expect(boundedFacts).toHaveLength(2);
        expect(yield* (yield* YieldService).earnedBetween('2026-03-29', '2026-03-29', euro.id)).toEqual({ value: 2, isEstimated: false });
    }).pipe(Effect.provide(Layer.mergeAll(YieldService.layer, YieldRepository.layer).pipe(Layer.provideMerge(TestLayer))))
);
