import { RefundPairRepository } from '@budgie/consolidation';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { seedExpenseWithoutRefund } from '../harness/seed-expense-without-refund';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const AMAZON_TITLE = 'Amazon';
const AMAZON_REFUND_TITLE = 'Скасування. Amazon';
const AMAZON_EXACT_AMOUNT_UAH = 1_513.63;
const AMAZON_EXACT_AMOUNT = AMAZON_EXACT_AMOUNT_UAH * PRECISION;
const AMAZON_CLOSE_AMOUNT_UAH = 899;
const AMAZON_CLOSE_AMOUNT = AMAZON_CLOSE_AMOUNT_UAH * PRECISION;
const AMAZON_MID_AMOUNT_UAH = 650;
const AMAZON_MID_AMOUNT = AMAZON_MID_AMOUNT_UAH * PRECISION;
const AMAZON_YEAR = 2026;
const AMAZON_EXACT_EXPENSE_OPERATED_AT = new Date(AMAZON_YEAR, 0, 20, 8, 0, 0);
const AMAZON_MID_EXPENSE_OPERATED_AT = new Date(AMAZON_YEAR, 0, 21, 11, 0, 0);
const AMAZON_CLOSE_EXPENSE_OPERATED_AT = new Date(AMAZON_YEAR, 0, 21, 12, 50, 0);
const AMAZON_EXACT_REFUND_DELAY_SECONDS = 29 * 60 * 60;

const TWIN_TITLE = 'Uber';
const TWIN_REFUND_TITLE = 'Скасування. Uber';
const TWIN_AMOUNT_UAH = 240;
const TWIN_AMOUNT = TWIN_AMOUNT_UAH * PRECISION;
const TWIN_MISMATCH_AMOUNT_UAH = 310;
const TWIN_MISMATCH_AMOUNT = TWIN_MISMATCH_AMOUNT_UAH * PRECISION;
const TWIN_YEAR = 2026;
const TWIN_FIRST_EXPENSE_OPERATED_AT = new Date(TWIN_YEAR, 1, 10, 8, 0, 0);
const TWIN_SECOND_EXPENSE_OPERATED_AT = new Date(TWIN_YEAR, 1, 10, 20, 0, 0);
const TWIN_MISMATCH_EXPENSE_OPERATED_AT = new Date(TWIN_YEAR, 1, 10, 20, 30, 0);
const TWIN_SECOND_REFUND_DELAY_SECONDS = 60 * 60;
const BALANCED_TWIN_FIRST_REFUND_DELAY_SECONDS = 13 * 60 * 60;
const BALANCED_TWIN_SECOND_REFUND_DELAY_SECONDS = 60 * 60 + 2;

layer(TestLayer)('consolidation/refund-pair-localized-exact-amount', it => {
    it.effect('auto-consolidates a localized refund to its unique exact-amount candidate over a closer-in-time mismatch', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const account = yield* testSeedService.account({ externalId: 'mono-card' });

            yield* seedExpenseWithoutRefund({
                accountId: account.id,
                title: AMAZON_TITLE,
                expenseAmount: AMAZON_CLOSE_AMOUNT,
                expenseOperatedAt: AMAZON_CLOSE_EXPENSE_OPERATED_AT,
                externalIdPrefix: 'amazon-close'
            });
            yield* seedExpenseWithoutRefund({
                accountId: account.id,
                title: AMAZON_TITLE,
                expenseAmount: AMAZON_MID_AMOUNT,
                expenseOperatedAt: AMAZON_MID_EXPENSE_OPERATED_AT,
                externalIdPrefix: 'amazon-mid'
            });
            const { expense: exactExpense, refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: AMAZON_TITLE,
                expenseAmount: AMAZON_EXACT_AMOUNT,
                refundAmounts: [AMAZON_EXACT_AMOUNT],
                refundTitle: AMAZON_REFUND_TITLE,
                expenseOperatedAt: AMAZON_EXACT_EXPENSE_OPERATED_AT,
                refundDelaySeconds: AMAZON_EXACT_REFUND_DELAY_SECONDS,
                externalIdPrefix: 'amazon-exact'
            });

            const autoCandidates = yield* refundPairRepository.findCandidates();
            expect(autoCandidates).toEqual([
                expect.objectContaining({
                    confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
                    expenseTransactionId: exactExpense.id,
                    refundIncomeTransactionIds: [refunds[0].id]
                })
            ]);

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(1);
            expect((yield* testQueryService.fetchTransactionById(exactExpense.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.REFUND
            );
            expect((yield* testQueryService.fetchTransactionById(refunds[0].id)).consolidationParentTransactionId).toBe(exactExpense.id);
        })
    );

    it.effect(
        'guesses the nearest exact-amount twin over a closer mismatched charge when identical fare twins make the match ambiguous',
        () =>
            Effect.gen(function* () {
                const refundPairRepository = yield* RefundPairRepository;
                const account = yield* testSeedService.account({ externalId: 'mono-card' });

                yield* seedExpenseWithoutRefund({
                    accountId: account.id,
                    title: TWIN_TITLE,
                    expenseAmount: TWIN_AMOUNT,
                    expenseOperatedAt: TWIN_FIRST_EXPENSE_OPERATED_AT,
                    externalIdPrefix: 'twin-first'
                });
                yield* seedExpenseWithoutRefund({
                    accountId: account.id,
                    title: TWIN_TITLE,
                    expenseAmount: TWIN_MISMATCH_AMOUNT,
                    expenseOperatedAt: TWIN_MISMATCH_EXPENSE_OPERATED_AT,
                    externalIdPrefix: 'twin-mismatch'
                });
                const { expense: secondExpense, refunds } = yield* testSeedService.refundedExpense({
                    accountId: account.id,
                    title: TWIN_TITLE,
                    expenseAmount: TWIN_AMOUNT,
                    refundAmounts: [TWIN_AMOUNT],
                    refundTitle: TWIN_REFUND_TITLE,
                    expenseOperatedAt: TWIN_SECOND_EXPENSE_OPERATED_AT,
                    refundDelaySeconds: TWIN_SECOND_REFUND_DELAY_SECONDS,
                    externalIdPrefix: 'twin-second'
                });

                const autoCandidates = yield* refundPairRepository.findCandidates();
                const reviewCandidates = yield* refundPairRepository.findReviewCandidates();

                expect(reviewCandidates).toHaveLength(0);
                expect(autoCandidates).toEqual([
                    expect.objectContaining({
                        confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
                        expenseTransactionId: secondExpense.id,
                        refundIncomeTransactionIds: [refunds[0].id]
                    })
                ]);

                const result = yield* runConsolidation();

                expect(result.consolidated).toBe(1);
            })
    );

    it.effect('auto-consolidates balanced identical twins where every charge has its own exact-amount cancellation', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const twins = yield* Effect.forEach(
                [
                    { expenseOperatedAt: TWIN_FIRST_EXPENSE_OPERATED_AT, refundDelaySeconds: BALANCED_TWIN_FIRST_REFUND_DELAY_SECONDS },
                    { expenseOperatedAt: TWIN_SECOND_EXPENSE_OPERATED_AT, refundDelaySeconds: BALANCED_TWIN_SECOND_REFUND_DELAY_SECONDS }
                ],
                (twin, index) =>
                    testSeedService.refundedExpense({
                        ...twin,
                        accountId: account.id,
                        title: TWIN_TITLE,
                        expenseAmount: TWIN_AMOUNT,
                        refundAmounts: [TWIN_AMOUNT],
                        refundTitle: TWIN_REFUND_TITLE,
                        externalIdPrefix: `balanced-twin-${index}`
                    })
            );

            const result = yield* runConsolidation();
            const expenseIds = twins.map(({ expense }) => expense.id);
            const refundParentIds = yield* Effect.forEach(twins, ({ refunds }) =>
                Effect.map(testQueryService.fetchTransactionById(refunds[0].id), refund => refund.consolidationParentTransactionId)
            );

            expect(result.consolidated).toBe(2);
            expect(new Set(refundParentIds)).toEqual(new Set(expenseIds));
        })
    );
});
