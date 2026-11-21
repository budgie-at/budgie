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

const CHAIN_CHARGE_AMOUNT = convertToMicroUnits(12);
const CHAIN_PARTIAL_REFUND_AMOUNT = convertToMicroUnits(10);
const CHAIN_TITLE = 'Lime';
const CHAIN_CHARGE_DAYS = [0, 4];
const CHAIN_REFUNDS = [
    { day: 19, amount: CHAIN_PARTIAL_REFUND_AMOUNT },
    { day: 28, amount: CHAIN_PARTIAL_REFUND_AMOUNT },
    { day: 32, amount: CHAIN_CHARGE_AMOUNT }
];

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

const seedTitledSide = Effect.fnUntraced(function* (accountId: number, isRefund: boolean, day: number, amount: number) {
    const externalId = `chain-${isRefund ? 'refund' : 'charge'}-${day}`;
    const entry = { accountId, amount };
    const transaction = isRefund
        ? yield* testSeedService.bankPairIncome({ externalId, operatedAt: atDay(day) }, entry)
        : yield* testSeedService.bankPairExpense({ externalId, operatedAt: atDay(day) }, entry);

    yield* testSeedService.updateTransaction(transaction.id, { title: CHAIN_TITLE });

    return { day, id: transaction.id };
});

const fetchRefundParents = (refundIds: readonly number[]) =>
    Effect.forEach(refundIds, refundId =>
        Effect.map(testQueryService.fetchTransactionById(refundId), refund => refund.consolidationParentTransactionId)
    );

const expectScopedRunMatchesFullRun = Effect.fnUntraced(function* (
    refundIds: readonly number[],
    fullRunParents: ReadonlyArray<number | null>
) {
    const scopedParents = yield* fetchRefundParents(refundIds);

    expect(scopedParents.filter((parentId, index) => isDefined(parentId) && parentId !== fullRunParents[index])).toEqual([]);

    yield* runConsolidation();

    expect(yield* fetchRefundParents(refundIds)).toEqual(fullRunParents);
});

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

            yield* expectScopedRunMatchesFullRun(refundIds, fullRunParents);
        })
    );

    it.effect('never pairs a refund differently from the full run when a later refund beyond the loaded rows claims a charge', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const charges = yield* Effect.forEach(CHAIN_CHARGE_DAYS, day => seedTitledSide(account.id, false, day, CHAIN_CHARGE_AMOUNT));
            const refunds = yield* Effect.forEach(CHAIN_REFUNDS, ({ day, amount }) => seedTitledSide(account.id, true, day, amount));
            const refundIds = refunds.map(refund => refund.id);

            yield* runConsolidation({
                operatedAtFrom: atDay(-1),
                operatedAtTo: atDay(1),
                transactionIds: charges.filter(({ day }) => day === 0).map(({ id }) => id)
            });

            yield* expectScopedRunMatchesFullRun(refundIds, [charges[0].id, null, charges[1].id]);
        })
    );
});
