import { convertToMicroUnits } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const DETERMINISM_START = new Date(2026, 9, 1, 9, 0, 0);
const TWIN_AMOUNT = convertToMicroUnits(454.3);
const PARTIAL_EXPENSE_AMOUNT = convertToMicroUnits(874.19);
const PARTIAL_REFUND_AMOUNT = convertToMicroUnits(451.08);

const SEED_STEPS = [
    { label: 'twin-expense-a', isRefund: false, title: 'JointLens', amount: TWIN_AMOUNT, offsetMs: 0 },
    { label: 'twin-expense-b', isRefund: false, title: 'JointLens', amount: TWIN_AMOUNT, offsetMs: 2 * HOUR_MS },
    { label: 'twin-refund-a', isRefund: true, title: 'Скасування. JointLens', amount: TWIN_AMOUNT, offsetMs: 4 * HOUR_MS },
    { label: 'twin-refund-b', isRefund: true, title: 'Скасування. JointLens', amount: TWIN_AMOUNT, offsetMs: 4 * HOUR_MS + 2000 },
    { label: 'partial-expense-a', isRefund: false, title: 'Amazon', amount: PARTIAL_EXPENSE_AMOUNT, offsetMs: 0 },
    { label: 'partial-expense-b', isRefund: false, title: 'Amazon', amount: PARTIAL_EXPENSE_AMOUNT, offsetMs: 4 * DAY_MS },
    { label: 'partial-refund-a', isRefund: true, title: 'Скасування. Amazon', amount: PARTIAL_REFUND_AMOUNT, offsetMs: 8 * DAY_MS },
    { label: 'partial-refund-b', isRefund: true, title: 'Скасування. Amazon', amount: PARTIAL_REFUND_AMOUNT, offsetMs: 9 * DAY_MS }
] as const;

const EXPECTED_PAIRS = {
    'partial-refund-a': 'partial-expense-b',
    'partial-refund-b': 'partial-expense-a',
    'twin-refund-a': 'twin-expense-a',
    'twin-refund-b': 'twin-expense-b'
};

layer(TestLayer)('consolidation/refund-pair-matcher-determinism', it => {
    it.effect.each([
        { name: 'chronological', order: [0, 1, 2, 3, 4, 5, 6, 7] },
        { name: 'reversed', order: [7, 6, 5, 4, 3, 2, 1, 0] },
        { name: 'interleaved', order: [3, 6, 0, 5, 2, 7, 1, 4] }
    ])('makes the same refund decisions whatever order the rows were inserted in ($name)', ({ order }) =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const seeded = yield* Effect.forEach(order, index =>
                Effect.gen(function* () {
                    const step = SEED_STEPS[index];
                    const operatedAt = new Date(DETERMINISM_START.getTime() + step.offsetMs);
                    const entry = { accountId: account.id, amount: step.amount };
                    const transaction = step.isRefund
                        ? yield* testSeedService.bankPairIncome({ externalId: step.label, operatedAt }, entry)
                        : yield* testSeedService.bankPairExpense({ externalId: step.label, operatedAt }, entry);

                    yield* testSeedService.updateTransaction(transaction.id, { title: step.title });

                    return { label: step.label, id: transaction.id, isRefund: step.isRefund };
                })
            );

            yield* runConsolidation();

            const labelById = new Map(seeded.map(({ id, label }) => [id, label]));
            const pairs = yield* Effect.forEach(
                seeded.filter(({ isRefund }) => isRefund),
                ({ id, label }) =>
                    Effect.map(testQueryService.fetchTransactionById(id), refund => [
                        label,
                        labelById.get(refund.consolidationParentTransactionId ?? 0) ?? null
                    ])
            );

            expect(Object.fromEntries(pairs)).toEqual(EXPECTED_PAIRS);
        })
    );
});
