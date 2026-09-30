import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { LanguageEnum, TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { runRefundScenario } from '../harness/run-refund-scenario';
import { refundPairRepository, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const APPLE_STORE_AMOUNT_UAH = 120;
const APPLE_STORE_AMOUNT = convertToMicroUnits(APPLE_STORE_AMOUNT_UAH);
const LIME_AMOUNT_UAH = 898;
const LIME_AMOUNT = convertToMicroUnits(LIME_AMOUNT_UAH);
const POSLUGY_AMOUNT_UAH = 85;
const POSLUGY_AMOUNT = convertToMicroUnits(POSLUGY_AMOUNT_UAH);
const COMFY_AMOUNT_UAH = 8_378.4;
const COMFY_AMOUNT = convertToMicroUnits(COMFY_AMOUNT_UAH);
const ROZETKA_AMOUNT_UAH = 1200;
const ROZETKA_AMOUNT = convertToMicroUnits(ROZETKA_AMOUNT_UAH);
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

layer(TestLayer)('consolidation/refund-pair-by-title', it => {
    it.effect.each(PROMOTE_SCENARIOS)('promotes the original expense when $name', ({ scenario, checksParent }) =>
        Effect.gen(function* () {
            const { consolidated, expense, refunds } = yield* runRefundScenario(scenario);

            expect(consolidated).toBe(1);
            expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);

            const promotedExpense = testQueryService.fetchTransactionById(expense.id);
            expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

            if (checksParent) {
                expect(promotedExpense.consolidationParentTransactionId).toBeNull();
            }
        })
    );

    it.effect('finds manual refund candidates only from refund income transactions', () =>
        Effect.gen(function* () {
            const account = testSeedService.account({ externalId: 'mono-card' });
            const { expense, refunds } = testSeedService.refundedExpense({
                accountId: account.id,
                expenseAmount: APPLE_STORE_AMOUNT,
                refundAmounts: [APPLE_STORE_AMOUNT],
                title: 'Apple Store',
                refundTitle: 'Apple Store refund'
            });

            const incomeCandidates = yield* refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '', LanguageEnum.EN);
            const expenseCandidates = yield* refundPairRepository.findRefundableExpenseCandidates(expense.id, '', LanguageEnum.EN);

            expect(incomeCandidates).toMatchObject([{ id: expense.id, type: TransactionTypeEnum.EXPENSE }]);
            expect(expenseCandidates).toEqual([]);
        })
    );

    it.effect('does not consolidate when titles differ', () =>
        Effect.gen(function* () {
            const account = testSeedService.account({ externalId: 'mono-card' });
            testSeedService.refundedExpense({
                accountId: account.id,
                expenseAmount: APPLE_STORE_AMOUNT,
                refundAmounts: [APPLE_STORE_AMOUNT],
                title: 'STARBUCKS #1234',
                refundTitle: 'WALMART #5678'
            });

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(0);
        })
    );

    it.effect('does not auto-consolidate one refund when multiple same-title expenses can claim it', () =>
        Effect.gen(function* () {
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

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(0);
        })
    );
});
