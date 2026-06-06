import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { runConsolidation } from '../harness/run-consolidation';
import { runRefundScenario } from '../harness/run-refund-scenario';
import { refundPairRepository, testQueryService, testSeedService } from '../harness/test-context';

describe('consolidation/refund-pair-by-title', () => {
    it.each([
        {
            name: 'title matches exactly within 30 days',
            scenario: { expenseAmount: 120 * PRECISION, refundAmounts: [120 * PRECISION] },
            checksParent: true
        },
        {
            name: 'a localized cancellation prefix leaves the same title',
            scenario: {
                expenseAmount: 898 * PRECISION,
                refundAmounts: [898 * PRECISION],
                title: 'Lime',
                refundTitle: 'Скасування. Lime'
            },
            checksParent: false
        },
        {
            name: 'a PrivatBank refund prefix leaves the same title',
            scenario: {
                expenseAmount: 85 * PRECISION,
                refundAmounts: [85 * PRECISION],
                title: 'Послуги',
                refundTitle: 'ПОВЕРНЕННЯ КОШТІВ, Послуги'
            },
            checksParent: false
        }
    ])('promotes the original expense when $name', async ({ scenario, checksParent }) => {
        const { consolidated, expense, refunds } = await runRefundScenario(scenario);

        expect(consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);

        const promotedExpense = testQueryService.fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        if (checksParent) {
            expect(promotedExpense.consolidationParentTransactionId).toBeNull();
        }
    });

    it('ranks a localized refund prefix as a single automatic refund candidate', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 898 * PRECISION,
            refundAmounts: [898 * PRECISION],
            title: 'Lime',
            refundTitle: 'Скасування. Lime'
        });

        const candidates = await refundPairRepository.findCandidates();

        expect(candidates).toEqual([
            {
                confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
                matchType: 'localized-refund-title',
                accountId: account.id,
                expenseTransactionId: expense.id,
                expenseEntryAmount: 898 * PRECISION,
                refundIncomeTransactionIds: [refunds[0].id],
                refundsTotal: 898 * PRECISION
            }
        ]);
    });

    it('ranks a PrivatBank refund prefix as a single automatic refund candidate', async () => {
        const account = testSeedService.account({ externalId: 'privat-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 85 * PRECISION,
            refundAmounts: [85 * PRECISION],
            title: 'Послуги',
            refundTitle: 'ПОВЕРНЕННЯ КОШТІВ, Послуги'
        });

        const candidates = await refundPairRepository.findCandidates();
        const incomeCandidates = await refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '');

        expect(candidates).toEqual([
            {
                confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
                matchType: 'localized-refund-title',
                accountId: account.id,
                expenseTransactionId: expense.id,
                expenseEntryAmount: 85 * PRECISION,
                refundIncomeTransactionIds: [refunds[0].id],
                refundsTotal: 85 * PRECISION
            }
        ]);
        expect(incomeCandidates).toMatchObject([{ id: expense.id, isRecommended: true }]);
    });

    it('finds manual refund candidates only from refund income transactions', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION],
            title: 'Apple Store',
            refundTitle: 'Apple Store refund'
        });

        const incomeCandidates = await refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '');
        const expenseCandidates = await refundPairRepository.findRefundableExpenseCandidates(expense.id, '');

        expect(incomeCandidates).toMatchObject([{ id: expense.id, type: TransactionTypeEnum.EXPENSE }]);
        expect(expenseCandidates).toEqual([]);
    });

    it('does not consolidate when titles differ', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            title: 'STARBUCKS #1234',
            refundTitle: 'WALMART #5678'
        });

        const result = await runConsolidation();
        expect(result.consolidated).toBe(0);
    });

    it('does not auto-consolidate one refund when multiple same-title expenses can claim it', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [],
            externalIdPrefix: 'first',
            expenseOperatedAt: new Date(2026, 0, 15, 12, 0, 0)
        });
        testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            externalIdPrefix: 'second',
            expenseOperatedAt: new Date(2026, 0, 16, 12, 0, 0)
        });

        const result = await runConsolidation();
        expect(result.consolidated).toBe(0);
    });

    it('auto-consolidates cancellation-prefixed card reversals to the nearest same-amount expense', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const amount = 3_963_900_000;
        const first = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: amount,
            refundAmounts: [amount],
            title: 'OBB',
            refundTitle: 'Скасування. OBB',
            expenseOperatedAt: new Date(2024, 11, 10, 19, 40, 59),
            refundDelaySeconds: 68,
            externalIdPrefix: 'obb-first'
        });
        const second = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: amount,
            refundAmounts: [amount],
            title: 'OBB',
            refundTitle: 'Скасування. OBB',
            expenseOperatedAt: new Date(2024, 11, 10, 19, 43, 29),
            refundDelaySeconds: 71,
            externalIdPrefix: 'obb-second'
        });

        const result = await runConsolidation();
        expect(result.consolidated).toBe(2);
        expect(testQueryService.fetchTransactionById(first.expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionById(first.refunds[0].id).consolidationParentTransactionId).toBe(first.expense.id);
        expect(testQueryService.fetchTransactionById(second.expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionById(second.refunds[0].id).consolidationParentTransactionId).toBe(second.expense.id);
    });
});
