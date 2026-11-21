import { RefundPairRepository } from '@budgie/consolidation';
import { convertToMicroUnits } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectRefundOutcome } from '../harness/expect-refund-outcome';
import { runConsolidation } from '../harness/run-consolidation';
import { seedExpenseWithoutRefund } from '../harness/seed-expense-without-refund';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const DAY_SECONDS = 24 * 60 * 60;
const NEAREST_YEAR = 2026;

const JOINTLENS_TITLE = 'JointLens';
const JOINTLENS_REFUND_TITLE = 'Скасування. JointLens';
const JOINTLENS_AMOUNT = convertToMicroUnits(454.3);
const JOINTLENS_FIRST_EXPENSE_OPERATED_AT = new Date(NEAREST_YEAR, 9, 3, 9, 0, 0);
const JOINTLENS_SECOND_EXPENSE_OPERATED_AT = new Date(NEAREST_YEAR, 9, 3, 10, 46, 22);
const JOINTLENS_FIRST_REFUND_DELAY_SECONDS = 13_206;
const JOINTLENS_SECOND_REFUND_DELAY_SECONDS = 7_996;

const AMAZON_TITLE = 'Amazon';
const AMAZON_REFUND_TITLE = 'Скасування. Amazon';
const AMAZON_CHARGE_AMOUNT = convertToMicroUnits(874.19);
const AMAZON_PARTIAL_REFUND_AMOUNT = convertToMicroUnits(451.08);
const AMAZON_FIRST_EXPENSE_OPERATED_AT = new Date(NEAREST_YEAR, 3, 1, 10, 0, 0);
const AMAZON_SECOND_EXPENSE_OPERATED_AT = new Date(NEAREST_YEAR, 3, 5, 10, 0, 0);
const AMAZON_REFUND_DELAY_SECONDS = 4 * DAY_SECONDS;

const BOLT_TITLE = 'Bolt';
const BOLT_REFUND_TITLE = 'Скасування. Bolt';
const BOLT_FARE_AMOUNT = convertToMicroUnits(186);
const BOLT_MISMATCH_AMOUNT = convertToMicroUnits(420);
const BOLT_FIRST_FARE_OPERATED_AT = new Date(NEAREST_YEAR, 2, 1, 8, 0, 0);
const BOLT_SECOND_FARE_OPERATED_AT = new Date(NEAREST_YEAR, 2, 2, 8, 0, 0);
const BOLT_MISMATCH_OPERATED_AT = new Date(NEAREST_YEAR, 2, 5, 8, 0, 0);
const BOLT_REFUND_DELAY_SECONDS = 4 * DAY_SECONDS;

const DECATHLON_TITLE = 'Decathlon';
const DECATHLON_REFUND_TITLE = 'Скасування. Decathlon';
const DECATHLON_REFUND_AMOUNT = convertToMicroUnits(150);
const DECATHLON_RECENT_EXPENSE_AMOUNT = convertToMicroUnits(300);
const DECATHLON_OLD_EXPENSE_OPERATED_AT = new Date(NEAREST_YEAR, 4, 1, 10, 0, 0);
const DECATHLON_RECENT_EXPENSE_OPERATED_AT = new Date(NEAREST_YEAR, 5, 5, 10, 0, 0);
const DECATHLON_REFUND_DELAY_SECONDS = 5 * DAY_SECONDS;

const FILL_TITLE = 'IKEA';
const FILL_EXPENSE_AMOUNT = convertToMicroUnits(300);
const FILL_FIRST_REFUND_AMOUNT = convertToMicroUnits(100);
const FILL_SECOND_REFUND_AMOUNT = convertToMicroUnits(120);
const FILL_OVERFLOW_REFUND_AMOUNT = convertToMicroUnits(150);
const FILL_LATE_REFUND_AMOUNT = convertToMicroUnits(80);
const FILL_EXPENSE_OPERATED_AT = new Date(NEAREST_YEAR, 6, 1, 10, 0, 0);
const FILL_LATE_REFUND_OPERATED_AT = new Date(NEAREST_YEAR, 6, 20, 10, 0, 0);

const OEBB_TITLE = 'OEBB';
const OEBB_TICKET_TITLE = 'OEBB 53600000021673280';
const OEBB_REFUND_TITLE = 'Скасування. OEBB 53600000021673280,Am Hauptbahnhof 2,Wien,AT';
const OEBB_OTHER_TICKET_REFUND_TITLE = 'Скасування. OEBB 53600000021673281,Am Hauptbahnhof 2,Wien,AT';
const OEBB_AMOUNT = convertToMicroUnits(59.9);
const OEBB_EXPENSE_OPERATED_AT = new Date(NEAREST_YEAR, 7, 1, 10, 0, 0);

const expectSolePairing = Effect.fnUntraced(function* (
    accountId: number,
    input: Omit<Parameters<typeof testSeedService.refundedExpense>[0], 'accountId'>
) {
    const { expense, refunds } = yield* testSeedService.refundedExpense({ ...input, accountId });

    expect((yield* runConsolidation()).consolidated).toBe(1);
    yield* expectRefundOutcome(expense.id, [refunds[0].id], [expense.id]);
});

layer(TestLayer)('consolidation/refund-pair-nearest-guess', it => {
    it.effect('pairs balanced JointLens twins one-to-one in chronological order', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const twins = yield* Effect.forEach(
                [
                    { expenseOperatedAt: JOINTLENS_FIRST_EXPENSE_OPERATED_AT, refundDelaySeconds: JOINTLENS_FIRST_REFUND_DELAY_SECONDS },
                    { expenseOperatedAt: JOINTLENS_SECOND_EXPENSE_OPERATED_AT, refundDelaySeconds: JOINTLENS_SECOND_REFUND_DELAY_SECONDS }
                ],
                (twin, index) =>
                    testSeedService.refundedExpense({
                        ...twin,
                        accountId: account.id,
                        title: JOINTLENS_TITLE,
                        expenseAmount: JOINTLENS_AMOUNT,
                        refundAmounts: [JOINTLENS_AMOUNT],
                        refundTitle: JOINTLENS_REFUND_TITLE,
                        externalIdPrefix: `jointlens-${index}`
                    })
            );

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(2);
            yield* Effect.forEach(twins, ({ expense, refunds }) => expectRefundOutcome(expense.id, [refunds[0].id], [expense.id]));
        })
    );

    it.effect('guesses the nearest preceding identical charge for a partial refund that fits both', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });

            yield* seedExpenseWithoutRefund({
                accountId: account.id,
                title: AMAZON_TITLE,
                expenseAmount: AMAZON_CHARGE_AMOUNT,
                expenseOperatedAt: AMAZON_FIRST_EXPENSE_OPERATED_AT,
                externalIdPrefix: 'amazon-first'
            });
            yield* expectSolePairing(account.id, {
                title: AMAZON_TITLE,
                expenseAmount: AMAZON_CHARGE_AMOUNT,
                refundAmounts: [AMAZON_PARTIAL_REFUND_AMOUNT],
                refundTitle: AMAZON_REFUND_TITLE,
                expenseOperatedAt: AMAZON_SECOND_EXPENSE_OPERATED_AT,
                refundDelaySeconds: AMAZON_REFUND_DELAY_SECONDS,
                externalIdPrefix: 'amazon-second'
            });
        })
    );

    it.effect('prefers an earlier exact-amount charge over a closer mismatched charge when guessing', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });

            yield* Effect.forEach(
                [
                    { amount: BOLT_FARE_AMOUNT, operatedAt: BOLT_FIRST_FARE_OPERATED_AT, prefix: 'bolt-first' },
                    { amount: BOLT_MISMATCH_AMOUNT, operatedAt: BOLT_MISMATCH_OPERATED_AT, prefix: 'bolt-mismatch' }
                ],
                ({ amount, operatedAt, prefix }) =>
                    seedExpenseWithoutRefund({
                        accountId: account.id,
                        title: BOLT_TITLE,
                        expenseAmount: amount,
                        expenseOperatedAt: operatedAt,
                        externalIdPrefix: prefix
                    })
            );
            yield* expectSolePairing(account.id, {
                title: BOLT_TITLE,
                expenseAmount: BOLT_FARE_AMOUNT,
                refundAmounts: [BOLT_FARE_AMOUNT],
                refundTitle: BOLT_REFUND_TITLE,
                expenseOperatedAt: BOLT_SECOND_FARE_OPERATED_AT,
                refundDelaySeconds: BOLT_REFUND_DELAY_SECONDS,
                externalIdPrefix: 'bolt-second'
            });
        })
    );

    it.effect('pairs the nearest auto candidate even when an older review-only charge fits the refund exactly', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });

            yield* seedExpenseWithoutRefund({
                accountId: account.id,
                title: DECATHLON_TITLE,
                expenseAmount: DECATHLON_REFUND_AMOUNT,
                expenseOperatedAt: DECATHLON_OLD_EXPENSE_OPERATED_AT,
                externalIdPrefix: 'decathlon-old'
            });
            yield* expectSolePairing(account.id, {
                title: DECATHLON_TITLE,
                expenseAmount: DECATHLON_RECENT_EXPENSE_AMOUNT,
                refundAmounts: [DECATHLON_REFUND_AMOUNT],
                refundTitle: DECATHLON_REFUND_TITLE,
                expenseOperatedAt: DECATHLON_RECENT_EXPENSE_OPERATED_AT,
                refundDelaySeconds: DECATHLON_REFUND_DELAY_SECONDS,
                externalIdPrefix: 'decathlon-recent'
            });
        })
    );

    it.effect(
        'fills an expense with several refunds up to its amount, drops the unselectable overflow from review and tops it up later',
        () =>
            Effect.gen(function* () {
                const refundPairRepository = yield* RefundPairRepository;
                const account = yield* testSeedService.account({ externalId: 'mono-card' });
                const { expense, refunds } = yield* testSeedService.refundedExpense({
                    accountId: account.id,
                    title: FILL_TITLE,
                    expenseAmount: FILL_EXPENSE_AMOUNT,
                    refundAmounts: [FILL_FIRST_REFUND_AMOUNT, FILL_SECOND_REFUND_AMOUNT, FILL_OVERFLOW_REFUND_AMOUNT],
                    expenseOperatedAt: FILL_EXPENSE_OPERATED_AT,
                    externalIdPrefix: 'fill'
                });

                expect((yield* runConsolidation()).consolidated).toBe(1);
                yield* expectRefundOutcome(
                    expense.id,
                    refunds.map(refund => refund.id),
                    [expense.id, expense.id, null]
                );
                expect(yield* refundPairRepository.findReviewCandidates()).toEqual([]);

                const lateRefund = yield* testSeedService.bankPairIncome(
                    { externalId: 'fill-late-refund', operatedAt: FILL_LATE_REFUND_OPERATED_AT },
                    { accountId: account.id, amount: FILL_LATE_REFUND_AMOUNT }
                );

                yield* testSeedService.updateTransaction(lateRefund.id, { title: FILL_TITLE });

                expect((yield* runConsolidation()).consolidated).toBe(1);
                yield* expectRefundOutcome(
                    expense.id,
                    [...refunds.map(refund => refund.id), lateRefund.id],
                    [expense.id, expense.id, null, expense.id]
                );
            })
    );

    it.effect('matches a cancellation whose title adds a ticket number to the charge title', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            yield* expectSolePairing(account.id, {
                title: OEBB_TITLE,
                expenseAmount: OEBB_AMOUNT,
                refundAmounts: [OEBB_AMOUNT],
                refundTitle: OEBB_REFUND_TITLE,
                expenseOperatedAt: OEBB_EXPENSE_OPERATED_AT,
                externalIdPrefix: 'oebb'
            });
        })
    );

    it.effect('never equates two different ticket numbers of the same merchant', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const { refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: OEBB_TICKET_TITLE,
                expenseAmount: OEBB_AMOUNT,
                refundAmounts: [OEBB_AMOUNT],
                refundTitle: OEBB_OTHER_TICKET_REFUND_TITLE,
                expenseOperatedAt: OEBB_EXPENSE_OPERATED_AT,
                externalIdPrefix: 'oebb-other-ticket'
            });

            expect(yield* refundPairRepository.findCandidates()).toEqual([]);
            expect((yield* runConsolidation()).consolidated).toBe(0);
            expect((yield* testQueryService.fetchTransactionById(refunds[0].id)).consolidationParentTransactionId).toBeNull();
        })
    );
});
