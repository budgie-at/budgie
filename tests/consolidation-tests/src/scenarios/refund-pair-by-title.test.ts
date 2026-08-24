import { PRECISION, TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { runRefundScenario } from '../harness/run-refund-scenario';
import { refundPairRepository, testQueryService, testSeedService } from '../harness/test-context';

const APPLE_STORE_AMOUNT_UAH = 120;
const APPLE_STORE_AMOUNT = APPLE_STORE_AMOUNT_UAH * PRECISION;
const LIME_AMOUNT_UAH = 898;
const LIME_AMOUNT = LIME_AMOUNT_UAH * PRECISION;
const POSLUGY_AMOUNT_UAH = 85;
const POSLUGY_AMOUNT = POSLUGY_AMOUNT_UAH * PRECISION;
const COMFY_AMOUNT = 8_378_400_000;
const ROZETKA_AMOUNT_UAH = 1200;
const ROZETKA_AMOUNT = ROZETKA_AMOUNT_UAH * PRECISION;
const FIRST_LIME_OPERATED_AT = new Date('2026-01-15T12:00:00');
const SECOND_LIME_OPERATED_AT = new Date('2026-01-16T12:00:00');

const PROMOTE_SCENARIOS = [
    {
        name: 'title matches exactly within 30 days',
        scenario: { expenseAmount: APPLE_STORE_AMOUNT, refundAmounts: [APPLE_STORE_AMOUNT] },
        checksParent: true
    },
    {
        name: 'a localized cancellation prefix leaves the same title',
        scenario: {
            expenseAmount: LIME_AMOUNT,
            refundAmounts: [LIME_AMOUNT],
            title: 'Lime',
            refundTitle: 'Скасування. Lime'
        },
        checksParent: false
    },
    {
        name: 'a PrivatBank refund prefix leaves the same title',
        scenario: {
            expenseAmount: POSLUGY_AMOUNT,
            refundAmounts: [POSLUGY_AMOUNT],
            title: 'Послуги',
            refundTitle: 'ПОВЕРНЕННЯ КОШТІВ, Послуги'
        },
        checksParent: false
    },
    {
        name: 'a Monobank payment refund prefix leaves the same merchant',
        scenario: {
            expenseAmount: COMFY_AMOUNT,
            refundAmounts: [COMFY_AMOUNT],
            title: 'Платіж COMFY',
            refundTitle: 'Повернення платежу COMFY'
        },
        checksParent: false
    },
    {
        name: 'a Monobank goods refund prefix leaves the same merchant',
        scenario: {
            expenseAmount: ROZETKA_AMOUNT,
            refundAmounts: [ROZETKA_AMOUNT],
            title: 'Платіж Rozetka',
            refundTitle: 'Повернення товару Rozetka'
        },
        checksParent: false
    },
    {
        name: 'uppercase Monobank refund and payment prefixes leave the same merchant',
        scenario: {
            expenseAmount: COMFY_AMOUNT,
            refundAmounts: [COMFY_AMOUNT],
            title: 'ПЛАТІЖ COMFY',
            refundTitle: 'ПОВЕРНЕННЯ ПЛАТЕЖУ COMFY'
        },
        checksParent: false
    }
];

describe('consolidation/refund-pair-by-title', () => {
    it.each(PROMOTE_SCENARIOS)('promotes the original expense when $name', async ({ scenario, checksParent }) => {
        const { consolidated, expense, refunds } = await runRefundScenario(scenario);

        expect(consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);

        const promotedExpense = testQueryService.fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        if (checksParent) {
            expect(promotedExpense.consolidationParentTransactionId).toBeNull();
        }
    });

    it('finds manual refund candidates only from refund income transactions', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: APPLE_STORE_AMOUNT,
            refundAmounts: [APPLE_STORE_AMOUNT],
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
            expenseAmount: APPLE_STORE_AMOUNT,
            refundAmounts: [APPLE_STORE_AMOUNT],
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
            expenseAmount: APPLE_STORE_AMOUNT,
            refundAmounts: [],
            externalIdPrefix: 'first',
            expenseOperatedAt: FIRST_LIME_OPERATED_AT
        });
        testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: APPLE_STORE_AMOUNT,
            refundAmounts: [APPLE_STORE_AMOUNT],
            externalIdPrefix: 'second',
            expenseOperatedAt: SECOND_LIME_OPERATED_AT
        });

        const result = await runConsolidation();
        expect(result.consolidated).toBe(0);
    });
});
