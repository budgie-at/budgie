import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { refundPairRepository, testQueryService, testSeedService } from '../harness/test-context';

const LIME_AMOUNT = 898_000_000;
const POSLUGY_AMOUNT = 85_000_000;
const COMFY_AMOUNT = 8_378_400_000;
const OBB_AMOUNT = 3_963_900_000;
const FIRST_OBB_OPERATED_AT = new Date('2024-12-10T19:40:59');
const SECOND_OBB_OPERATED_AT = new Date('2024-12-10T19:43:29');
const FIRST_OBB_REFUND_DELAY_SECONDS = 68;
const SECOND_OBB_REFUND_DELAY_SECONDS = 71;

const expectLocalizedAutoCandidate = async (input: {
    readonly accountExternalId: string;
    readonly amount: number;
    readonly title: string;
    readonly refundTitle: string;
}) => {
    const account = testSeedService.account({ externalId: input.accountExternalId });
    const { expense, refunds } = testSeedService.refundedExpense({
        accountId: account.id,
        expenseAmount: input.amount,
        refundAmounts: [input.amount],
        title: input.title,
        refundTitle: input.refundTitle
    });

    const candidates = await refundPairRepository.findCandidates();

    expect(candidates).toEqual([
        {
            confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
            matchType: 'localized-refund-title',
            accountId: account.id,
            expenseTransactionId: expense.id,
            expenseEntryAmount: input.amount,
            refundIncomeTransactionIds: [refunds[0].id],
            refundsTotal: input.amount
        }
    ]);

    return { expense, refunds };
};

describe('consolidation/refund-pair-by-title-candidates', () => {
    it('ranks a localized refund prefix as a single automatic refund candidate', async () => {
        await expectLocalizedAutoCandidate({
            accountExternalId: 'mono-card',
            amount: LIME_AMOUNT,
            title: 'Lime',
            refundTitle: 'Скасування. Lime'
        });
    });

    it('ranks a PrivatBank refund prefix as a single automatic refund candidate', async () => {
        const { expense, refunds } = await expectLocalizedAutoCandidate({
            accountExternalId: 'privat-card',
            amount: POSLUGY_AMOUNT,
            title: 'Послуги',
            refundTitle: 'ПОВЕРНЕННЯ КОШТІВ, Послуги'
        });

        const incomeCandidates = await refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '');
        expect(incomeCandidates).toMatchObject([{ id: expense.id, isRecommended: true }]);
    });

    it('ranks a Monobank payment refund prefix as a single automatic refund candidate', async () => {
        await expectLocalizedAutoCandidate({
            accountExternalId: 'mono-card',
            amount: COMFY_AMOUNT,
            title: 'Платіж COMFY',
            refundTitle: 'Повернення платежу COMFY'
        });
    });

    it('auto-consolidates cancellation-prefixed card reversals to the nearest same-amount expense', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const first = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: OBB_AMOUNT,
            refundAmounts: [OBB_AMOUNT],
            title: 'OBB',
            refundTitle: 'Скасування. OBB',
            expenseOperatedAt: FIRST_OBB_OPERATED_AT,
            refundDelaySeconds: FIRST_OBB_REFUND_DELAY_SECONDS,
            externalIdPrefix: 'obb-first'
        });
        const second = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: OBB_AMOUNT,
            refundAmounts: [OBB_AMOUNT],
            title: 'OBB',
            refundTitle: 'Скасування. OBB',
            expenseOperatedAt: SECOND_OBB_OPERATED_AT,
            refundDelaySeconds: SECOND_OBB_REFUND_DELAY_SECONDS,
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
