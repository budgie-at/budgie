import { convertToMicroUnits } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { runConsolidation } from '../harness/run-consolidation';
import { seedExpenseWithoutRefund } from '../harness/seed-expense-without-refund';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const DAY_MS = 24 * 60 * 60 * 1000;
const PARITY_TITLE = 'Netflix';
const PARITY_AMOUNT = convertToMicroUnits(379);
const PARITY_START = new Date(2026, 8, 1, 10, 0, 0);
const FIRST_EXPENSE_DAY = 0;
const SECOND_EXPENSE_DAY = 20;
const FIRST_REFUND_DAY = 25;
const SECOND_REFUND_DAY = 35;

const atDay = (day: number): Date => new Date(PARITY_START.getTime() + day * DAY_MS);

const seedChain = Effect.gen(function* () {
    const account = yield* testSeedService.account({ externalId: 'mono-card' });
    const [firstExpense, secondExpense] = yield* Effect.forEach([FIRST_EXPENSE_DAY, SECOND_EXPENSE_DAY], day =>
        Effect.map(
            seedExpenseWithoutRefund({
                accountId: account.id,
                title: PARITY_TITLE,
                expenseAmount: PARITY_AMOUNT,
                expenseOperatedAt: atDay(day),
                externalIdPrefix: `parity-expense-${day}`
            }),
            ({ expense }) => ({ day, id: expense.id })
        )
    );
    const [firstRefund, secondRefund] = yield* Effect.forEach([FIRST_REFUND_DAY, SECOND_REFUND_DAY], day =>
        Effect.gen(function* () {
            const refund = yield* testSeedService.bankPairIncome(
                { externalId: `parity-refund-${day}`, operatedAt: atDay(day) },
                { accountId: account.id, amount: PARITY_AMOUNT }
            );

            yield* testSeedService.updateTransaction(refund.id, { title: PARITY_TITLE });

            return { day, id: refund.id };
        })
    );

    return { expenses: [firstExpense, secondExpense], refunds: [firstRefund, secondRefund] };
});

const fetchRefundParents = (refundIds: readonly number[]) =>
    Effect.forEach(refundIds, refundId =>
        Effect.map(testQueryService.fetchTransactionById(refundId), refund => refund.consolidationParentTransactionId)
    );

layer(TestLayer)('consolidation/refund-pair-scoped-parity', it => {
    it.effect.each([
        { name: 'the first charge', fromDay: -1, toDay: 1 },
        { name: 'the second charge and first refund', fromDay: 19, toDay: 26 },
        { name: 'the first refund', fromDay: 24, toDay: 26 },
        { name: 'the second refund', fromDay: 34, toDay: 36 }
    ])('never pairs a refund differently from the full run in a scoped run over $name', ({ fromDay, toDay }) =>
        Effect.gen(function* () {
            const { expenses, refunds } = yield* seedChain;
            const refundIds = refunds.map(refund => refund.id);
            const fullRunParents = expenses.map(expense => expense.id);

            yield* runConsolidation({
                operatedAtFrom: atDay(fromDay),
                operatedAtTo: atDay(toDay),
                transactionIds: [...expenses, ...refunds].filter(({ day }) => day >= fromDay && day <= toDay).map(({ id }) => id)
            });

            const scopedParents = yield* fetchRefundParents(refundIds);

            expect(scopedParents.filter((parentId, index) => isDefined(parentId) && parentId !== fullRunParents[index])).toEqual([]);

            yield* runConsolidation();

            expect(yield* fetchRefundParents(refundIds)).toEqual(fullRunParents);
        })
    );
});
