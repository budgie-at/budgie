import { RefundPairRepository } from '@budgie/consolidation';
import { LanguageEnum, PRECISION } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const SEEZONA_EXPENSE_AMOUNT_UAH = 103.2;
const SEEZONA_EXPENSE_AMOUNT = SEEZONA_EXPENSE_AMOUNT_UAH * PRECISION;
const SEEZONA_REFUND_AMOUNT_UAH = 102;
const SEEZONA_REFUND_AMOUNT = SEEZONA_REFUND_AMOUNT_UAH * PRECISION;
const STARBUCKS_EXPENSE_AMOUNT_UAH = 120;
const STARBUCKS_EXPENSE_AMOUNT = STARBUCKS_EXPENSE_AMOUNT_UAH * PRECISION;
const LIME_EXPENSE_AMOUNT_UAH = 898;
const LIME_EXPENSE_AMOUNT = LIME_EXPENSE_AMOUNT_UAH * PRECISION;
const LIME_REFUND_YEAR = 2026;
const FIRST_LIME_EXPENSE_OPERATED_AT = new Date(LIME_REFUND_YEAR, 0, 15, 12, 0, 0);
const SECOND_LIME_EXPENSE_OPERATED_AT = new Date(LIME_REFUND_YEAR, 0, 16, 12, 0, 0);

const seedSeezonaRefund = (accountId: number, refundAccountId?: number) => {
    const mcc = testQueryService.findMccByCode('5621');

    return testSeedService.refundedExpense({
        accountId,
        ...(isDefined(refundAccountId) && { refundAccountId }),
        expenseAmount: SEEZONA_EXPENSE_AMOUNT,
        refundAmounts: [SEEZONA_REFUND_AMOUNT],
        title: 'Seezona',
        refundTitle: 'Скасування. Seezona,Stockholm,SE',
        mccCategoryId: mcc.id,
        refundMccCategoryId: mcc.id,
        refundDelaySeconds: 50 * 24 * 60 * 60
    });
};

const expectManualSeezonaCandidate = Effect.fnUntraced(function* (refundId: number, accountTitle?: string) {
    const refundPairRepository = yield* RefundPairRepository;
    const autoCandidates = yield* refundPairRepository.findCandidates();
    const reviewCandidates = yield* refundPairRepository.findReviewCandidates();
    const manualCandidates = yield* refundPairRepository.findRefundableExpenseCandidates(refundId, '', LanguageEnum.EN);

    expect(autoCandidates).toHaveLength(0);
    expect(reviewCandidates.length).toBeGreaterThanOrEqual(1);
    expect(manualCandidates).toMatchObject([
        {
            title: 'Seezona',
            ...(isDefined(accountTitle) && { accountTitle }),
            isRecommended: true
        }
    ]);
});

layer(TestLayer)('consolidation/refund-pair-manual-review', it => {
    it.effect('counts a prefix-stripped + same-MCC pair for manual review but does not auto-consolidate it', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const account = testSeedService.account({ externalId: 'mono-card' });
            const mcc = testQueryService.findMccByCode('5814');
            const { expense, refunds } = testSeedService.refundedExpense({
                accountId: account.id,
                expenseAmount: STARBUCKS_EXPENSE_AMOUNT,
                refundAmounts: [STARBUCKS_EXPENSE_AMOUNT],
                title: 'STARBUCKS #1234',
                refundTitle: 'REFUND STARBUCKS #1234',
                mccCategoryId: mcc.id,
                refundMccCategoryId: mcc.id
            });

            const autoCandidates = yield* refundPairRepository.findCandidates();
            const reviewCandidates = yield* refundPairRepository.findReviewCandidates();
            expect(autoCandidates).toHaveLength(0);
            expect(reviewCandidates.length).toBeGreaterThanOrEqual(1);

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(0);
            expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBeNull();
            expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBeNull();
        })
    );

    it.effect('recommends a localized cancellation with a location suffix for manual review', () =>
        Effect.gen(function* () {
            const account = testSeedService.account({ externalId: 'mono-card' });
            const { refunds } = seedSeezonaRefund(account.id);

            yield* expectManualSeezonaCandidate(refunds[0].id);
        })
    );

    it.effect('recommends same-currency refunds from another account for manual review', () =>
        Effect.gen(function* () {
            const expenseAccount = testSeedService.account({ title: 'Expense Card', externalId: 'mono-expense-card' });
            const refundAccount = testSeedService.account({ title: 'Refund Card', externalId: 'mono-refund-card' });
            const { refunds } = seedSeezonaRefund(expenseAccount.id, refundAccount.id);

            yield* expectManualSeezonaCandidate(refunds[0].id, 'Expense Card');
        })
    );

    it.effect('does not treat prefix-only refund titles as broad manual-review matches', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const account = testSeedService.account({ externalId: 'mono-card' });
            const mcc = testQueryService.findMccByCode('5814');

            testSeedService.refundedExpense({
                accountId: account.id,
                expenseAmount: STARBUCKS_EXPENSE_AMOUNT,
                refundAmounts: [STARBUCKS_EXPENSE_AMOUNT],
                title: 'STARBUCKS #1234',
                refundTitle: 'REFUND',
                mccCategoryId: mcc.id,
                refundMccCategoryId: mcc.id
            });

            const reviewCandidates = yield* refundPairRepository.findReviewCandidates();

            expect(reviewCandidates).toHaveLength(0);
        })
    );

    it.effect('surfaces a gated-out localized-refund-title candidate for manual review when multiple expenses compete', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const account = testSeedService.account({ externalId: 'mono-card' });
            testSeedService.refundedExpense({
                accountId: account.id,
                expenseAmount: LIME_EXPENSE_AMOUNT,
                refundAmounts: [],
                title: 'Lime',
                externalIdPrefix: 'first',
                expenseOperatedAt: FIRST_LIME_EXPENSE_OPERATED_AT
            });
            const { expense: secondExpense, refunds } = testSeedService.refundedExpense({
                accountId: account.id,
                expenseAmount: LIME_EXPENSE_AMOUNT,
                refundAmounts: [LIME_EXPENSE_AMOUNT],
                title: 'Lime',
                refundTitle: 'Скасування. Lime',
                externalIdPrefix: 'second',
                expenseOperatedAt: SECOND_LIME_EXPENSE_OPERATED_AT,
                refundDelaySeconds: 24 * 60 * 60
            });

            const autoCandidates = yield* refundPairRepository.findCandidates();
            const reviewCandidates = yield* refundPairRepository.findReviewCandidates();

            expect(autoCandidates).toHaveLength(0);
            expect(reviewCandidates).toEqual([
                {
                    confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
                    matchType: 'localized-refund-title',
                    accountId: account.id,
                    expenseTransactionId: secondExpense.id,
                    expenseEntryAmount: LIME_EXPENSE_AMOUNT,
                    refundIncomeTransactionIds: [refunds[0].id],
                    refundsTotal: LIME_EXPENSE_AMOUNT
                }
            ]);
        })
    );
});
