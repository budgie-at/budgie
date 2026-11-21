import { RefundPairRepository } from '@budgie/consolidation';
import { ExternalSourceEnum, LanguageEnum, convertToMicroUnits } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { seedPrivatbankTransaction } from '../harness/seed-privatbank-transaction';
import { seedTitledTransaction } from '../harness/seed-titled-transaction';
import { rebuildStoredBalances, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const DAY_MS = 24 * 60 * 60 * 1000;
const CLOSURE_TITLE = 'Amazon';
const CLOSURE_REFUND_TITLE = 'ПОВЕРНЕННЯ КОШТІВ, Amazon';
const CLOSURE_ORIGINAL_AMOUNT = 32.26;
const CLOSURE_EXPENSE_RATE = 50;
const CLOSURE_FALLING_RATE = 49;
const CLOSURE_RISING_RATE = 52;
const CLOSURE_LATE_REFUND_AMOUNT = convertToMicroUnits(20);
const CLOSURE_START = new Date(2026, 7, 1, 10, 0, 0);

const atDay = (day: number): Date => new Date(CLOSURE_START.getTime() + day * DAY_MS);

const seedPrivatbankPair = Effect.fnUntraced(function* (refundRate: number, refundDay: number) {
    const account = yield* testSeedService.account({ externalId: 'privat-card', externalSource: ExternalSourceEnum.PRIVATBANK });
    const expense = yield* seedPrivatbankTransaction({
        accountId: account.id,
        exchangeRate: CLOSURE_EXPENSE_RATE,
        externalId: 'closure-expense',
        isRefund: false,
        operatedAt: atDay(0),
        originalAmount: CLOSURE_ORIGINAL_AMOUNT,
        title: CLOSURE_TITLE
    });
    const refund = yield* seedPrivatbankTransaction({
        accountId: account.id,
        exchangeRate: refundRate,
        externalId: 'closure-refund',
        isRefund: true,
        operatedAt: atDay(refundDay),
        originalAmount: CLOSURE_ORIGINAL_AMOUNT,
        title: CLOSURE_REFUND_TITLE
    });

    return { account, expense, refund };
});

layer(TestLayer)('consolidation/refund-pair-privatbank-closure', it => {
    it.effect('keeps an expense closed after a falling-rate original-amount reversal so a later refund stays unpaired', () =>
        Effect.gen(function* () {
            const { account, expense, refund } = yield* seedPrivatbankPair(CLOSURE_FALLING_RATE, 2);

            expect((yield* runConsolidation()).consolidated).toBe(1);
            expect((yield* testQueryService.fetchTransactionById(refund.id)).consolidationParentTransactionId).toBe(expense.id);

            const lateRefund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'closure-late-refund',
                operatedAt: atDay(5),
                amount: CLOSURE_LATE_REFUND_AMOUNT,
                title: CLOSURE_TITLE,
                isRefund: true
            });

            yield* rebuildStoredBalances;

            expect(yield* Effect.flatMap(RefundPairRepository, refundPairRepository => refundPairRepository.findCandidates())).toEqual([]);

            expect((yield* runConsolidation()).consolidated).toBe(0);
            expect((yield* testQueryService.fetchTransactionById(lateRefund.id)).consolidationParentTransactionId).toBeNull();
        })
    );

    it.effect('lists a late rising-rate original-amount refund for review exactly as the manual picker offers it', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const { expense, refund } = yield* seedPrivatbankPair(CLOSURE_RISING_RATE, 40);

            expect(yield* refundPairRepository.findRefundableExpenseCandidates(refund.id, '', LanguageEnum.EN)).toEqual([
                expect.objectContaining({ id: expense.id })
            ]);
            expect(yield* refundPairRepository.findReviewCandidates()).toEqual([
                expect.objectContaining({ expenseTransactionId: expense.id, refundIncomeTransactionIds: [refund.id] })
            ]);
        })
    );
});
