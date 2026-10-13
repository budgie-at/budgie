import { RefundConsolidationService, RefundPairRepository } from '@budgie/consolidation';
import { convertToMicroUnits, ExternalSourceEnum, LanguageEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectRefundOutcome } from '../harness/expect-refund-outcome';
import { fetchTotalExpense } from '../harness/fetch-total-expense';
import { runConsolidation } from '../harness/run-consolidation';
import { seedPrivatbankTransaction } from '../harness/seed-privatbank-transaction';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const REFUND_TITLE = 'ПОВЕРНЕННЯ КОШТІВ, Покупки';
const EXPENSE_RATE = 50;
const RISING_REFUND_RATE = 51;
const ORIGINAL_AMOUNT = 100;
const OVER_REFUND_ORIGINAL_AMOUNT = 101;
const EXPENSE_OPERATED_AT = new Date(2026, 6, 1, 10, 0, 0);
const REFUND_OPERATED_AT = new Date(2026, 6, 6, 10, 0, 0);
const FX_GAIN = convertToMicroUnits(ORIGINAL_AMOUNT * (EXPENSE_RATE - RISING_REFUND_RATE));

const seedPair = Effect.fnUntraced(function* (refundRate: number, refundOriginalAmount: number) {
    const account = yield* testSeedService.account({ externalId: 'privat-card', externalSource: ExternalSourceEnum.PRIVATBANK });
    const expense = yield* seedPrivatbankTransaction({
        accountId: account.id,
        exchangeRate: EXPENSE_RATE,
        externalId: 'privat-expense',
        isRefund: false,
        operatedAt: EXPENSE_OPERATED_AT,
        originalAmount: ORIGINAL_AMOUNT,
        title: 'Zalando'
    });
    const refund = yield* seedPrivatbankTransaction({
        accountId: account.id,
        exchangeRate: refundRate,
        externalId: 'privat-refund',
        isRefund: true,
        operatedAt: REFUND_OPERATED_AT,
        originalAmount: refundOriginalAmount,
        title: REFUND_TITLE
    });

    return { expense, refund };
});

const expectRefundRejected = Effect.fnUntraced(function* (expenseId: number, refundId: number) {
    const refundConsolidationService = yield* RefundConsolidationService;
    const refundPairRepository = yield* RefundPairRepository;

    expect(yield* refundPairRepository.findCandidates()).toEqual([]);
    expect(yield* refundPairRepository.findReviewCandidates()).toEqual([]);
    expect(yield* refundConsolidationService.findRefundableExpenses(refundId, '', LanguageEnum.EN)).toEqual([]);
    expect(
        yield* Effect.flip(
            refundConsolidationService.convertToRefund({ refundIncomeTransactionId: refundId, expenseTransactionId: expenseId })
        )
    ).toMatchObject({ _tag: 'RefundExceedsExpenseError' });
    expect((yield* runConsolidation()).consolidated).toBe(0);
    expect((yield* testQueryService.fetchTransactionById(refundId)).consolidationParentTransactionId).toBeNull();
});

layer(TestLayer)('consolidation/refund-pair-privatbank-rising-rate', it => {
    it.effect('auto-consolidates a full original-amount refund booked at a higher rate and leaves a negative remainder', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const { expense, refund } = yield* seedPair(RISING_REFUND_RATE, ORIGINAL_AMOUNT);

            expect(yield* refundPairRepository.findCandidates()).toEqual([
                expect.objectContaining({
                    confidenceBucket: 'AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT',
                    expenseTransactionId: expense.id,
                    refundIncomeTransactionIds: [refund.id]
                })
            ]);
            expect(yield* refundPairRepository.findReviewCandidates()).toEqual([]);
            expect((yield* runConsolidation()).consolidated).toBe(1);
            yield* expectRefundOutcome(expense.id, [refund.id], [expense.id]);
            expect(yield* fetchTotalExpense()).toBe(FX_GAIN);
        })
    );

    it.effect('manually converts a full original-amount refund booked at a higher rate', () =>
        Effect.gen(function* () {
            const refundConsolidationService = yield* RefundConsolidationService;
            const { expense, refund } = yield* seedPair(RISING_REFUND_RATE, ORIGINAL_AMOUNT);

            expect(yield* refundConsolidationService.findRefundableExpenses(refund.id, '', LanguageEnum.EN)).toMatchObject([
                { id: expense.id }
            ]);
            expect(
                yield* refundConsolidationService.convertToRefund({
                    refundIncomeTransactionId: refund.id,
                    expenseTransactionId: expense.id
                })
            ).toBe(expense.id);
            yield* expectRefundOutcome(expense.id, [refund.id], [expense.id]);
            expect(yield* fetchTotalExpense()).toBe(FX_GAIN);
        })
    );

    it.effect('rejects a refund whose original-currency amount exceeds the expense', () =>
        Effect.flatMap(seedPair(EXPENSE_RATE, OVER_REFUND_ORIGINAL_AMOUNT), ({ expense, refund }) =>
            expectRefundRejected(expense.id, refund.id)
        )
    );

    it.effect('rejects a non-Privatbank full original-amount refund booked at a higher rate', () =>
        Effect.gen(function* () {
            const { expense, refund } = yield* seedPair(RISING_REFUND_RATE, ORIGINAL_AMOUNT);

            yield* testSeedService.updateTransaction(expense.id, { externalSource: ExternalSourceEnum.MONOBANK });
            yield* testSeedService.updateTransaction(refund.id, { externalSource: ExternalSourceEnum.MONOBANK });
            yield* expectRefundRejected(expense.id, refund.id);
        })
    );
});
