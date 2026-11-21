import { ConsolidationRepairExecutorService, RefundConsolidationService, RefundPairRepository } from '@budgie/consolidation';
import { TransactionEntryEntityTable, TransactionEntityTable, TransactionTypeEnum, convertToMicroUnits } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { REJECTED_PAYMENT_FEE_TITLE } from '../harness/rejected-payment-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { seedTitledTransaction } from '../harness/seed-titled-transaction';
import { testDb, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

import type { RefundCandidateInterface } from '@budgie/contracts';

const DAY_MS = 24 * 60 * 60 * 1000;
const EXECUTION_TITLE = 'Mango';
const EXECUTION_EXPENSE_AMOUNT = convertToMicroUnits(100);
const EXECUTION_REFUND_AMOUNT = convertToMicroUnits(80);
const EXECUTION_EDITED_REFUND_AMOUNT = convertToMicroUnits(120);
const EXECUTION_FEE_TITLED_AMOUNT = convertToMicroUnits(60);
const EXECUTION_EXPENSE_OPERATED_AT = new Date(2026, 6, 1, 10, 0, 0);
const EXECUTION_FEE_AMOUNT = convertToMicroUnits(20);
const EXECUTION_FEE_REFUND_AMOUNT = convertToMicroUnits(10);
const EXECUTION_EDITED_FEE_REFUND_AMOUNT = convertToMicroUnits(15);

const scanRefund = Effect.gen(function* () {
    const refundPairRepository = yield* RefundPairRepository;
    const account = yield* testSeedService.account({ externalId: 'mono-card' });
    const seedSide = (isRefund: boolean, amount: number, operatedAt: Date) =>
        seedTitledTransaction({
            accountId: account.id,
            amount,
            externalId: `execution-${isRefund ? 'refund' : 'expense'}`,
            isRefund,
            operatedAt,
            title: EXECUTION_TITLE
        });
    const expense = yield* seedSide(false, EXECUTION_EXPENSE_AMOUNT, EXECUTION_EXPENSE_OPERATED_AT);
    const refund = yield* seedSide(true, EXECUTION_REFUND_AMOUNT, new Date(EXECUTION_EXPENSE_OPERATED_AT.getTime() + DAY_MS));
    const [candidate] = yield* refundPairRepository.findCandidates();

    return { account, candidate, expense, refund };
});

const expectRefused = Effect.fnUntraced(function* (candidate: RefundCandidateInterface, refundId: number) {
    const consolidationRepairExecutorService = yield* ConsolidationRepairExecutorService;

    expect(yield* consolidationRepairExecutorService.consolidateRefund(candidate)).toBe(false);
    expect((yield* testQueryService.fetchTransactionById(refundId)).consolidationParentTransactionId).toBeNull();
});

layer(TestLayer)('consolidation/refund-pair-execution-guards', it => {
    it.effect('counts a manually linked fee-titled refund against the principal of the expense', () =>
        Effect.gen(function* () {
            const refundConsolidationService = yield* RefundConsolidationService;
            const { account, candidate, expense, refund } = yield* scanRefund;
            const feeTitledRefund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'execution-fee-titled',
                operatedAt: new Date(EXECUTION_EXPENSE_OPERATED_AT.getTime() + 2 * DAY_MS),
                amount: EXECUTION_FEE_TITLED_AMOUNT,
                title: REJECTED_PAYMENT_FEE_TITLE,
                isRefund: true
            });

            yield* refundConsolidationService.convertToRefund({
                expenseTransactionId: expense.id,
                refundIncomeTransactionId: feeTitledRefund.id
            });
            yield* expectRefused(candidate, refund.id);
            expect((yield* runConsolidation()).consolidated).toBe(0);
        })
    );

    it.effect('refuses a scanned refund whose amount grew past the expense before execution', () =>
        Effect.gen(function* () {
            const { candidate, refund } = yield* scanRefund;

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ amount: EXECUTION_EDITED_REFUND_AMOUNT })
                .where(eq(TransactionEntryEntityTable.transactionId, refund.id));
            yield* expectRefused(candidate, refund.id);
        })
    );

    it.effect('refuses a scanned refund that became a transfer before execution', () =>
        Effect.gen(function* () {
            const { candidate, refund } = yield* scanRefund;

            yield* testDb
                .update(TransactionEntityTable)
                .set({ type: TransactionTypeEnum.TRANSFER })
                .where(eq(TransactionEntityTable.id, refund.id));
            yield* expectRefused(candidate, refund.id);
        })
    );

    it.effect('refuses scanned fee refunds whose live total grew past the fee before execution', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'privat-card' });
            const { expense, refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: EXECUTION_TITLE,
                refundTitle: REJECTED_PAYMENT_FEE_TITLE,
                expenseAmount: EXECUTION_EXPENSE_AMOUNT,
                expenseFeeAmount: EXECUTION_FEE_AMOUNT,
                refundAmounts: [EXECUTION_FEE_REFUND_AMOUNT, EXECUTION_FEE_REFUND_AMOUNT],
                expenseOperatedAt: EXECUTION_EXPENSE_OPERATED_AT,
                refundDelaySeconds: 60,
                externalIdPrefix: 'execution-fee-group'
            });
            const candidate: RefundCandidateInterface = {
                accountId: account.id,
                confidenceBucket: 'AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE',
                expenseEntryAmount: EXECUTION_EXPENSE_AMOUNT,
                expenseTransactionId: expense.id,
                matchType: 'rejected-payment-fee-title',
                refundIncomeTransactionIds: refunds.map(refund => refund.id),
                refundsTotal: EXECUTION_FEE_REFUND_AMOUNT * refunds.length
            };

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ amount: EXECUTION_EDITED_FEE_REFUND_AMOUNT })
                .where(eq(TransactionEntryEntityTable.transactionId, refunds[1].id));
            yield* expectRefused(candidate, refunds[0].id);
        })
    );
});
