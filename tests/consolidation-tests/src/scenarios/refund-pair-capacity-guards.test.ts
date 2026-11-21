import { ConsolidationRepairExecutorService, RefundConsolidationService, RefundPairRepository } from '@budgie/consolidation';
import { ExternalSourceEnum, convertToMicroUnits } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    REJECTED_PAYMENT_FEE_TITLE,
    REJECTED_PAYMENT_HIGH_FEE_FEE_AMOUNT,
    REJECTED_PAYMENT_HIGH_FEE_PRIMARY_AMOUNT
} from '../harness/rejected-payment-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { seedPrivatbankTransaction } from '../harness/seed-privatbank-transaction';
import { seedTitledTransaction } from '../harness/seed-titled-transaction';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const GUARD_YEAR = 2026;
const DAY_MS = 24 * 60 * 60 * 1000;
const GUARD_TITLE = 'Zara';
const GUARD_EXPENSE_AMOUNT = convertToMicroUnits(100);
const GUARD_MANUAL_REFUND_AMOUNT = convertToMicroUnits(60);
const GUARD_AUTO_REFUND_AMOUNT = convertToMicroUnits(50);
const GUARD_SCANNED_REFUND_AMOUNT = convertToMicroUnits(80);
const GUARD_EXPENSE_OPERATED_AT = new Date(GUARD_YEAR, 4, 1, 10, 0, 0);

const PRIVATBANK_EXPENSE_RATE = 50;
const PRIVATBANK_REFUND_RATE = 49;
const PRIVATBANK_ORIGINAL_AMOUNT = 32.26;
const PRIVATBANK_REFUND_TITLE = 'ПОВЕРНЕННЯ КОШТІВ, Продукти';
const PRIVATBANK_FEE_AMOUNT = convertToMicroUnits(5);
const PRIVATBANK_FEE_EXPENSE_AMOUNT = convertToMicroUnits(100);
const PRIVATBANK_START = new Date(GUARD_YEAR, 5, 1, 10, 0, 0);

const atDay = (start: Date, day: number): Date => new Date(start.getTime() + day * DAY_MS);

const fetchParentId = (transactionId: number) =>
    Effect.map(testQueryService.fetchTransactionById(transactionId), transaction => transaction.consolidationParentTransactionId);

layer(TestLayer)('consolidation/refund-pair-capacity-guards', it => {
    it.effect('counts a manual refund from another account against the expense before auto pairing a second refund', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const refundConsolidationService = yield* RefundConsolidationService;
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const otherAccount = yield* testSeedService.account({ externalId: 'mono-other-card' });
            const { expense, refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                refundAccountId: otherAccount.id,
                title: GUARD_TITLE,
                refundTitle: 'Manual refund',
                expenseAmount: GUARD_EXPENSE_AMOUNT,
                refundAmounts: [GUARD_MANUAL_REFUND_AMOUNT],
                expenseOperatedAt: GUARD_EXPENSE_OPERATED_AT,
                externalIdPrefix: 'cross-account'
            });

            yield* refundConsolidationService.convertToRefund({
                expenseTransactionId: expense.id,
                refundIncomeTransactionId: refunds[0].id
            });
            const autoRefund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'cross-account-auto',
                operatedAt: atDay(GUARD_EXPENSE_OPERATED_AT, 3),
                amount: GUARD_AUTO_REFUND_AMOUNT,
                title: GUARD_TITLE,
                isRefund: true
            });

            expect(yield* refundPairRepository.findCandidates()).toEqual([]);
            expect((yield* runConsolidation()).consolidated).toBe(0);
            expect(yield* fetchParentId(autoRefund.id)).toBeNull();
        })
    );

    it.effect('drops a scanned refund group when a manual conversion fills the expense before it executes', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const refundConsolidationService = yield* RefundConsolidationService;
            const consolidationRepairExecutorService = yield* ConsolidationRepairExecutorService;
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const { expense, refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: GUARD_TITLE,
                expenseAmount: GUARD_EXPENSE_AMOUNT,
                refundAmounts: [GUARD_SCANNED_REFUND_AMOUNT],
                expenseOperatedAt: GUARD_EXPENSE_OPERATED_AT,
                externalIdPrefix: 'scanned'
            });
            const [candidate] = yield* refundPairRepository.findCandidates();
            const manualRefund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'scanned-manual',
                operatedAt: atDay(GUARD_EXPENSE_OPERATED_AT, 2),
                amount: GUARD_AUTO_REFUND_AMOUNT,
                title: 'Manual refund',
                isRefund: true
            });

            yield* refundConsolidationService.convertToRefund({
                expenseTransactionId: expense.id,
                refundIncomeTransactionId: manualRefund.id
            });

            expect(yield* consolidationRepairExecutorService.consolidateRefund(candidate)).toBe(false);
            expect(yield* fetchParentId(refunds[0].id)).toBeNull();
        })
    );

    it.effect('never adds a fee refund to an expense a Privatbank original-amount refund already closed in the same run', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'privat-card', externalSource: ExternalSourceEnum.PRIVATBANK });
            const seedPrivatbankExpense = (externalId: string, day: number) =>
                seedPrivatbankTransaction({
                    accountId: account.id,
                    exchangeRate: PRIVATBANK_EXPENSE_RATE,
                    externalId,
                    isRefund: false,
                    operatedAt: atDay(PRIVATBANK_START, day),
                    originalAmount: PRIVATBANK_ORIGINAL_AMOUNT,
                    title: 'Amazon'
                });

            yield* seedPrivatbankExpense('privat-twin', 0);
            const { expense: feeExpense } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: 'Shop',
                expenseAmount: PRIVATBANK_FEE_EXPENSE_AMOUNT,
                expenseFeeAmount: PRIVATBANK_FEE_AMOUNT,
                refundAmounts: [],
                expenseOperatedAt: atDay(PRIVATBANK_START, 5),
                externalIdPrefix: 'fee-expense'
            });
            const closedExpense = yield* seedPrivatbankExpense('privat-closed', 10);

            yield* testSeedService.feeEntry(closedExpense.id, 'privat-closed-fee', {
                accountId: account.id,
                amount: PRIVATBANK_FEE_AMOUNT
            });
            const privatbankRefund = yield* seedPrivatbankTransaction({
                accountId: account.id,
                exchangeRate: PRIVATBANK_REFUND_RATE,
                externalId: 'privat-refund',
                isRefund: true,
                operatedAt: atDay(PRIVATBANK_START, 11),
                originalAmount: PRIVATBANK_ORIGINAL_AMOUNT,
                title: PRIVATBANK_REFUND_TITLE
            });
            const feeRefund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'privat-fee-refund',
                operatedAt: atDay(PRIVATBANK_START, 12),
                amount: PRIVATBANK_FEE_AMOUNT,
                title: REJECTED_PAYMENT_FEE_TITLE,
                isRefund: true
            });

            yield* runConsolidation();

            expect(yield* fetchParentId(privatbankRefund.id)).toBe(closedExpense.id);
            expect(yield* fetchParentId(feeRefund.id)).toBe(feeExpense.id);
        })
    );

    it.effect('does not list a user-unpaired fee refund larger than the expense amount for manual review', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const transactionService = yield* TransactionService;
            const account = yield* testSeedService.account({ externalId: 'mono-card' });
            const { expense, refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: GUARD_TITLE,
                expenseAmount: REJECTED_PAYMENT_HIGH_FEE_PRIMARY_AMOUNT,
                expenseFeeAmount: REJECTED_PAYMENT_HIGH_FEE_FEE_AMOUNT,
                refundAmounts: [REJECTED_PAYMENT_HIGH_FEE_FEE_AMOUNT],
                refundTitle: REJECTED_PAYMENT_FEE_TITLE,
                expenseOperatedAt: GUARD_EXPENSE_OPERATED_AT,
                externalIdPrefix: 'unpaired-fee'
            });

            expect((yield* runConsolidation()).consolidated).toBe(1);
            expect(yield* fetchParentId(refunds[0].id)).toBe(expense.id);

            yield* transactionService.revertConsolidationByUser(expense.id);

            expect(yield* refundPairRepository.findReviewCandidates()).toEqual([]);
        })
    );
});
