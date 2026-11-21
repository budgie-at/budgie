import { RefundPairRepository } from '@budgie/consolidation';
import { convertToMicroUnits } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';

import { testSeedService, TestLayer } from '../harness/test-context';

const SCALE_TWIN_COUNT = 50;
const SCALE_AMOUNT = convertToMicroUnits(454.3);
const SCALE_START = new Date(2026, 9, 1, 8, 0, 0);
const SCALE_STEP_MS = 60 * 1000;
const SCALE_REFUND_OFFSET_MS = 2 * 60 * 60 * 1000;
const SCALE_BUDGET_MS = 2000;

const seedSide = Effect.fnUntraced(function* (accountId: number, isRefund: boolean, index: number) {
    const externalId = `scale-${isRefund ? 'refund' : 'charge'}-${index}`;
    const operatedAt = new Date(SCALE_START.getTime() + index * SCALE_STEP_MS + (isRefund ? SCALE_REFUND_OFFSET_MS : 0));
    const entry = { accountId, amount: SCALE_AMOUNT };
    const transaction = isRefund
        ? yield* testSeedService.bankPairIncome({ externalId, operatedAt }, entry)
        : yield* testSeedService.bankPairExpense({ externalId, operatedAt }, entry);

    yield* testSeedService.updateTransaction(transaction.id, { title: isRefund ? 'Скасування. JointLens' : 'JointLens' });
});

layer(TestLayer)('consolidation/refund-pair-matcher-scale', it => {
    it.effect('matches fifty identical charges against fifty identical refunds quickly', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const indexes = Array.from({ length: SCALE_TWIN_COUNT }, (_, index) => index);

            yield* Effect.forEach(indexes, index => seedSide(account.id, false, index));
            yield* Effect.forEach(indexes, index => seedSide(account.id, true, index));

            const startedAt = yield* Clock.currentTimeMillis;
            const candidates = yield* refundPairRepository.findCandidates();
            const elapsedMs = (yield* Clock.currentTimeMillis) - startedAt;

            expect(candidates).toHaveLength(SCALE_TWIN_COUNT);
            expect(elapsedMs).toBeLessThan(SCALE_BUDGET_MS);
        })
    );
});
