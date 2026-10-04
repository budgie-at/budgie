import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { RefundPairRepository } from '@budgie/consolidation';
import { ExternalSourceEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectRefundOutcome } from '../harness/expect-refund-outcome';
import { runConsolidation } from '../harness/run-consolidation';
import { seedExpenseWithoutRefund } from '../harness/seed-expense-without-refund';
import { testSeedService, TestLayer } from '../harness/test-context';

import type { RefundAutoConfidenceBucket, RefundCandidateBaseInterface, RefundCandidateInterface } from '@budgie/contracts';

const DAY_SECONDS = 24 * 60 * 60;
const MISSED_REFUND_YEAR = 2026;

const BILLA_TITLE = 'BILLA DANKT 6210 WIEN';
const BILLA_FIRST_AMOUNT = convertToMicroUnits(12.1);
const BILLA_SECOND_AMOUNT = convertToMicroUnits(18);
const BILLA_FIRST_EXPENSE_OPERATED_AT = new Date(MISSED_REFUND_YEAR, 1, 7, 12, 0, 0);
const BILLA_SECOND_EXPENSE_OPERATED_AT = new Date(MISSED_REFUND_YEAR, 1, 8, 12, 0, 0);

const PAYPAL_TITLE = 'PAYPAL *STEAM GAMES';
const PAYPAL_AMOUNT = convertToMicroUnits(8849.6);
const PAYPAL_FIRST_EXPENSE_OPERATED_AT = new Date(MISSED_REFUND_YEAR, 4, 13, 9, 0, 0);
const PAYPAL_SECOND_EXPENSE_OPERATED_AT = new Date(MISSED_REFUND_YEAR, 4, 13, 9, 10, 0);
const PAYPAL_REFUND_DELAY_SECONDS = 10 * 60;

const PRIVATBANK_REFUND_TITLE = 'ПОВЕРНЕННЯ КОШТІВ, Продукти';
const PRIVATBANK_EXPENSE_RATE = 50;
const PRIVATBANK_REFUND_RATE = 49;
const PRIVATBANK_ORIGINAL_AMOUNT = 32.26;
const PRIVATBANK_DECOY_ORIGINAL_AMOUNT = 40;
const PRIVATBANK_EXPENSE_OPERATED_AT = new Date(MISSED_REFUND_YEAR, 5, 20, 10, 0, 0);
const PRIVATBANK_DECOY_EXPENSE_OPERATED_AT = new Date(MISSED_REFUND_YEAR, 5, 22, 10, 0, 0);
const PRIVATBANK_REFUND_OPERATED_AT = new Date(MISSED_REFUND_YEAR, 5, 25, 23, 59, 59);

const ERSTE_TITLE = 'SEEZONA STOCKHOLM 11457 752';
const ERSTE_AMOUNT = convertToMicroUnits(7.75);
const ERSTE_OPERATED_AT = new Date(MISSED_REFUND_YEAR, 0, 15, 0, 0, 0);

const ORSAY_TITLE = 'GOPAY  *ORSAY.AT';
const ORSAY_REFUND_TITLE = 'Скасування. GOPAY  *ORSAY.AT,https://orsay,CZ';
const ORSAY_EXPENSE_AMOUNT = convertToMicroUnits(6821.77);
const ORSAY_REFUND_AMOUNT = convertToMicroUnits(2317.4);
const ORSAY_EXPENSE_OPERATED_AT = new Date(MISSED_REFUND_YEAR, 8, 23, 11, 0, 0);
const ORSAY_REFUND_DELAY_SECONDS = 18 * DAY_SECONDS;

const SHOP_TITLE = 'Zalando';
const SHOP_REFUND_TITLE = 'Скасування. Zalando';
const SHOP_SMALL_EXPENSE_AMOUNT = convertToMicroUnits(100);
const SHOP_LARGE_EXPENSE_AMOUNT = convertToMicroUnits(300);
const SHOP_SMALL_REFUND_AMOUNT = convertToMicroUnits(90);
const SHOP_LARGE_REFUND_AMOUNT = convertToMicroUnits(280);
const SHOP_SMALL_EXPENSE_OPERATED_AT = new Date(MISSED_REFUND_YEAR, 2, 1, 10, 0, 0);
const SHOP_LARGE_EXPENSE_OPERATED_AT = new Date(MISSED_REFUND_YEAR, 2, 2, 10, 0, 0);

const findRefundCandidates = Effect.fnUntraced(function* () {
    const refundPairRepository = yield* RefundPairRepository;

    return {
        autoCandidates: yield* refundPairRepository.findCandidates(),
        reviewCandidates: yield* refundPairRepository.findReviewCandidates()
    };
});

const expectCandidateGroups = (
    candidates: readonly RefundCandidateBaseInterface[],
    expected: ReadonlyArray<Partial<RefundCandidateInterface>>
) => {
    expect(candidates).toEqual(expect.arrayContaining(expected.map(group => expect.objectContaining(group))));
    expect(candidates).toHaveLength(expected.length);
};

const expectSoleAutoRefund = Effect.fnUntraced(function* (
    expenseId: number,
    refundId: number,
    confidenceBucket: RefundAutoConfidenceBucket
) {
    const { autoCandidates } = yield* findRefundCandidates();

    expectCandidateGroups(autoCandidates, [{ confidenceBucket, expenseTransactionId: expenseId, refundIncomeTransactionIds: [refundId] }]);
    expect((yield* runConsolidation()).consolidated).toBe(1);
    yield* expectRefundOutcome(expenseId, [refundId], [expenseId]);
});

const seedPrivatbankTransaction = Effect.fnUntraced(function* (input: {
    readonly accountId: number;
    readonly exchangeRate: number;
    readonly externalId: string;
    readonly isRefund: boolean;
    readonly operatedAt: Date;
    readonly originalAmount: number;
    readonly title: string;
}) {
    const entry = {
        accountId: input.accountId,
        amount: convertToMicroUnits(input.originalAmount * input.exchangeRate),
        exchangeRate: input.exchangeRate
    };
    const transaction = input.isRefund
        ? yield* testSeedService.bankPairIncome({ externalId: input.externalId, operatedAt: input.operatedAt }, entry)
        : yield* testSeedService.bankPairExpense({ externalId: input.externalId, operatedAt: input.operatedAt }, entry);

    return yield* testSeedService.updateTransaction(transaction.id, { title: input.title, externalSource: ExternalSourceEnum.PRIVATBANK });
});

layer(TestLayer)('consolidation/refund-pair-missed-refund-matches', it => {
    it.effect('auto-consolidates exact-title refunds to their unique exact-amount expense when the title has several candidates', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'erste-card' });
            const first = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: BILLA_TITLE,
                expenseAmount: BILLA_FIRST_AMOUNT,
                refundAmounts: [BILLA_FIRST_AMOUNT],
                expenseOperatedAt: BILLA_FIRST_EXPENSE_OPERATED_AT,
                refundDelaySeconds: 5 * DAY_SECONDS,
                externalIdPrefix: 'billa-first'
            });
            const second = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: BILLA_TITLE,
                expenseAmount: BILLA_SECOND_AMOUNT,
                refundAmounts: [BILLA_SECOND_AMOUNT],
                expenseOperatedAt: BILLA_SECOND_EXPENSE_OPERATED_AT,
                refundDelaySeconds: 4 * DAY_SECONDS,
                externalIdPrefix: 'billa-second'
            });

            const { autoCandidates } = yield* findRefundCandidates();

            expectCandidateGroups(autoCandidates, [
                {
                    confidenceBucket: 'AUTO_REFUND_EXACT_TITLE',
                    expenseTransactionId: first.expense.id,
                    refundIncomeTransactionIds: [first.refunds[0].id]
                },
                {
                    confidenceBucket: 'AUTO_REFUND_EXACT_TITLE',
                    expenseTransactionId: second.expense.id,
                    refundIncomeTransactionIds: [second.refunds[0].id]
                }
            ]);
            expect((yield* runConsolidation()).consolidated).toBe(2);
            yield* expectRefundOutcome(first.expense.id, [first.refunds[0].id], [first.expense.id]);
            yield* expectRefundOutcome(second.expense.id, [second.refunds[0].id], [second.expense.id]);
        })
    );

    it.effect('keeps an exact-title refund for review when two identical expenses match its exact amount', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'privat-card' });

            yield* seedExpenseWithoutRefund({
                accountId: account.id,
                title: PAYPAL_TITLE,
                expenseAmount: PAYPAL_AMOUNT,
                expenseOperatedAt: PAYPAL_FIRST_EXPENSE_OPERATED_AT,
                externalIdPrefix: 'paypal-first'
            });
            const { refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: PAYPAL_TITLE,
                expenseAmount: PAYPAL_AMOUNT,
                refundAmounts: [PAYPAL_AMOUNT],
                expenseOperatedAt: PAYPAL_SECOND_EXPENSE_OPERATED_AT,
                refundDelaySeconds: PAYPAL_REFUND_DELAY_SECONDS,
                externalIdPrefix: 'paypal-second'
            });

            const { autoCandidates, reviewCandidates } = yield* findRefundCandidates();

            expect(autoCandidates).toHaveLength(0);
            expectCandidateGroups(reviewCandidates, [
                { confidenceBucket: 'AUTO_REFUND_EXACT_TITLE', refundIncomeTransactionIds: [refunds[0].id] }
            ]);
            expect((yield* runConsolidation()).consolidated).toBe(0);
        })
    );

    it.effect('auto-consolidates a Privatbank category-titled refund by its original-currency amount', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'privat-card', externalSource: ExternalSourceEnum.PRIVATBANK });
            const expense = yield* seedPrivatbankTransaction({
                accountId: account.id,
                exchangeRate: PRIVATBANK_EXPENSE_RATE,
                externalId: 'privat-amazon',
                isRefund: false,
                operatedAt: PRIVATBANK_EXPENSE_OPERATED_AT,
                originalAmount: PRIVATBANK_ORIGINAL_AMOUNT,
                title: 'Amazon'
            });

            yield* seedPrivatbankTransaction({
                accountId: account.id,
                exchangeRate: PRIVATBANK_EXPENSE_RATE,
                externalId: 'privat-decoy',
                isRefund: false,
                operatedAt: PRIVATBANK_DECOY_EXPENSE_OPERATED_AT,
                originalAmount: PRIVATBANK_DECOY_ORIGINAL_AMOUNT,
                title: 'Amazon Marketplace'
            });
            const refund = yield* seedPrivatbankTransaction({
                accountId: account.id,
                exchangeRate: PRIVATBANK_REFUND_RATE,
                externalId: 'privat-refund',
                isRefund: true,
                operatedAt: PRIVATBANK_REFUND_OPERATED_AT,
                originalAmount: PRIVATBANK_ORIGINAL_AMOUNT,
                title: PRIVATBANK_REFUND_TITLE
            });

            yield* expectSoleAutoRefund(expense.id, refund.id, 'AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT');
        })
    );

    it.effect('auto-consolidates a date-only refund booked at the same timestamp as its expense', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'erste-card', externalSource: ExternalSourceEnum.ERSTE });
            const { expense, refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: ERSTE_TITLE,
                expenseAmount: ERSTE_AMOUNT,
                refundAmounts: [ERSTE_AMOUNT],
                expenseOperatedAt: ERSTE_OPERATED_AT,
                refundDelaySeconds: 0,
                externalIdPrefix: 'erste-seezona'
            });

            yield* expectSoleAutoRefund(expense.id, refunds[0].id, 'AUTO_REFUND_EXACT_TITLE');
        })
    );

    it.effect('auto-consolidates a cancellation whose title carries a comma-separated merchant address', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const { expense, refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: ORSAY_TITLE,
                refundTitle: ORSAY_REFUND_TITLE,
                expenseAmount: ORSAY_EXPENSE_AMOUNT,
                refundAmounts: [ORSAY_REFUND_AMOUNT],
                expenseOperatedAt: ORSAY_EXPENSE_OPERATED_AT,
                refundDelaySeconds: ORSAY_REFUND_DELAY_SECONDS,
                externalIdPrefix: 'orsay'
            });

            yield* expectSoleAutoRefund(expense.id, refunds[0].id, 'AUTO_REFUND_LOCALIZED_REFUND_TITLE');
        })
    );

    it.effect('reviews each ambiguous refund against the closest covering expense instead of the nearest in time', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const smallExpense = yield* seedExpenseWithoutRefund({
                accountId: account.id,
                title: SHOP_TITLE,
                expenseAmount: SHOP_SMALL_EXPENSE_AMOUNT,
                expenseOperatedAt: SHOP_SMALL_EXPENSE_OPERATED_AT,
                externalIdPrefix: 'shop-small'
            });
            const { expense: largeExpense, refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: SHOP_TITLE,
                refundTitle: SHOP_REFUND_TITLE,
                expenseAmount: SHOP_LARGE_EXPENSE_AMOUNT,
                refundAmounts: [SHOP_SMALL_REFUND_AMOUNT, SHOP_LARGE_REFUND_AMOUNT],
                expenseOperatedAt: SHOP_LARGE_EXPENSE_OPERATED_AT,
                refundDelaySeconds: DAY_SECONDS,
                externalIdPrefix: 'shop-large'
            });

            const { autoCandidates, reviewCandidates } = yield* findRefundCandidates();

            expect(autoCandidates).toHaveLength(0);
            expectCandidateGroups(reviewCandidates, [
                { expenseTransactionId: smallExpense.expense.id, refundIncomeTransactionIds: [refunds[0].id] },
                { expenseTransactionId: largeExpense.id, refundIncomeTransactionIds: [refunds[1].id] }
            ]);
        })
    );
});
