import { RefundPairRepository } from '@budgie/consolidation';
import { convertToMicroUnits } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { seedTitledTransaction } from '../harness/seed-titled-transaction';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DEFERRAL_START = new Date(2026, 9, 1, 10, 0, 0);
const DEFERRAL_TITLE = 'Uniqlo';
const COVER_AMOUNT = convertToMicroUnits(100);
const SMALL_AMOUNT = convertToMicroUnits(5);
const DENSE_COUNT = 400;
const DENSE_AMOUNT = convertToMicroUnits(454.3);
const DENSE_TIMEOUT_MS = 120_000;

const atOffset = (offsetMs: number): Date => new Date(DEFERRAL_START.getTime() + offsetMs);

const seedSide = (accountId: number, isRefund: boolean, externalId: string, operatedAt: Date, amount: number) =>
    seedTitledTransaction({ accountId, amount, externalId, isRefund, operatedAt, title: DEFERRAL_TITLE });

const firstDayScope = (transactionIds: readonly number[]) => ({
    operatedAtFrom: atOffset(-DAY_MS),
    operatedAtTo: atOffset(DAY_MS),
    transactionIds
});

layer(TestLayer)('consolidation/refund-pair-scoped-deferral', it => {
    it.effect('pairs an in-scope refund whose only cover is in scope despite a later charge too small to cover it', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const cover = yield* seedSide(account.id, false, 'deferral-cover', atOffset(0), COVER_AMOUNT);

            yield* seedSide(account.id, false, 'deferral-small', atOffset(2 * DAY_MS), SMALL_AMOUNT);
            const refund = yield* seedSide(account.id, true, 'deferral-refund', atOffset(3 * DAY_MS), COVER_AMOUNT);

            yield* runConsolidation(firstDayScope([cover.id]));

            expect((yield* testQueryService.fetchTransactionById(refund.id)).consolidationParentTransactionId).toBe(cover.id);
        })
    );

    it.effect(
        'defers an in-scope refund chained to a dense run of charges past the scope end without overflowing',
        () =>
            Effect.gen(function* () {
                const refundPairRepository = yield* RefundPairRepository;
                const account = yield* testSeedService.account({ externalId: 'mono-card' });
                const indexes = Array.from({ length: DENSE_COUNT }, (_, index) => index);
                const inScopeCharge = yield* seedSide(account.id, false, 'dense-in-scope-charge', atOffset(0), DENSE_AMOUNT);
                const inScopeRefund = yield* seedSide(account.id, true, 'dense-in-scope-refund', atOffset(HOUR_MS), DENSE_AMOUNT);

                yield* Effect.forEach(indexes, index =>
                    seedSide(account.id, false, `dense-charge-${index}`, atOffset(2 * DAY_MS + index * MINUTE_MS), DENSE_AMOUNT)
                );
                yield* Effect.forEach(indexes, index =>
                    seedSide(account.id, true, `dense-refund-${index}`, atOffset(3 * DAY_MS + index * MINUTE_MS), DENSE_AMOUNT)
                );

                const scopedRefundIds = (yield* refundPairRepository.findCandidates(
                    firstDayScope([inScopeCharge.id, inScopeRefund.id])
                )).flatMap(candidate => candidate.refundIncomeTransactionIds);
                const fullRunRefundIds = (yield* refundPairRepository.findCandidates()).flatMap(
                    candidate => candidate.refundIncomeTransactionIds
                );

                expect(scopedRefundIds).not.toContain(inScopeRefund.id);
                expect(fullRunRefundIds).toContain(inScopeRefund.id);
            }),
        DENSE_TIMEOUT_MS
    );
});
