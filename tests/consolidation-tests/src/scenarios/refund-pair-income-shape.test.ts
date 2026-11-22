import { ConsolidationRepairExecutorService, RefundPairRepository } from '@budgie/consolidation';
import {
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { seedTitledTransaction } from '../harness/seed-titled-transaction';
import { testDb, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const DAY_MS = 24 * 60 * 60 * 1000;
const SHAPE_TITLE = 'Reserved';
const SHAPE_EXPENSE_AMOUNT = convertToMicroUnits(100);
const SHAPE_HALF_AMOUNT = convertToMicroUnits(60);
const SHAPE_SCANNED_AMOUNT = convertToMicroUnits(80);
const SHAPE_SCANNED_HALF_AMOUNT = convertToMicroUnits(40);
const SHAPE_EXPENSE_OPERATED_AT = new Date(2026, 8, 1, 10, 0, 0);

const seedChargeAndIncome = Effect.fnUntraced(function* (incomeAmount: number) {
    const account = yield* testSeedService.account({ externalId: 'mono-card' });
    const seedSide = (isRefund: boolean, amount: number, dayOffset: number) =>
        seedTitledTransaction({
            accountId: account.id,
            amount,
            externalId: `shape-${isRefund ? 'income' : 'expense'}`,
            isRefund,
            operatedAt: new Date(SHAPE_EXPENSE_OPERATED_AT.getTime() + dayOffset * DAY_MS),
            title: SHAPE_TITLE
        });
    const expense = yield* seedSide(false, SHAPE_EXPENSE_AMOUNT, 0);
    const income = yield* seedSide(true, incomeAmount, 1);

    return { account, expense, income };
});

const addSecondDebit = (transactionId: number, accountId: number, amount: number) =>
    testDb.insert(TransactionEntryEntityTable).values({
        transactionId,
        accountId,
        type: TransactionEntryTypeEnum.DEBIT,
        amount,
        exchangeRate: 1,
        baseExchangeRate: 1,
        baseAmount: amount
    });

const expectNeverCandidate = Effect.fnUntraced(function* (incomeId: number) {
    const refundPairRepository = yield* RefundPairRepository;

    expect(yield* refundPairRepository.findCandidates()).toEqual([]);
    expect(yield* refundPairRepository.findReviewCandidates()).toEqual([]);
    expect((yield* runConsolidation()).consolidated).toBe(0);
    expect((yield* testQueryService.fetchTransactionById(incomeId)).consolidationParentTransactionId).toBeNull();
});

layer(TestLayer)('consolidation/refund-pair-income-shape', it => {
    it.effect('never pairs an income split across two live entries', () =>
        Effect.gen(function* () {
            const { account, income } = yield* seedChargeAndIncome(SHAPE_HALF_AMOUNT);

            yield* addSecondDebit(income.id, account.id, SHAPE_HALF_AMOUNT);
            yield* expectNeverCandidate(income.id);
        })
    );

    it.effect('refuses a scanned refund that was split into two entries before execution', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const consolidationRepairExecutorService = yield* ConsolidationRepairExecutorService;
            const { account, income } = yield* seedChargeAndIncome(SHAPE_SCANNED_AMOUNT);
            const [candidate] = yield* refundPairRepository.findCandidates();

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ amount: SHAPE_SCANNED_HALF_AMOUNT })
                .where(eq(TransactionEntryEntityTable.transactionId, income.id));
            yield* addSecondDebit(income.id, account.id, SHAPE_SCANNED_HALF_AMOUNT);

            expect(yield* consolidationRepairExecutorService.consolidateRefund(candidate)).toBe(false);
            expect((yield* testQueryService.fetchTransactionById(income.id)).consolidationParentTransactionId).toBeNull();
        })
    );

    it.effect('never treats a manual-duplicate canonical income as a refund candidate', () =>
        Effect.gen(function* () {
            const { income } = yield* seedChargeAndIncome(SHAPE_SCANNED_AMOUNT);

            yield* testDb
                .update(TransactionEntityTable)
                .set({ consolidationType: TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE })
                .where(eq(TransactionEntityTable.id, income.id));
            yield* expectNeverCandidate(income.id);
        })
    );
});
