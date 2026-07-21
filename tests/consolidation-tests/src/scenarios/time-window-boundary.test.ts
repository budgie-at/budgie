import { PRECISION, TRANSFER_PAIR_TIME_WINDOW_SECONDS, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

const seedTimeWindowPair = (incomeOffsetSeconds: number): void => {
    const { fromAccount, toAccount } = testSeedService.accountPair('UA-FROM', 'UA-TO');
    const operatedAt = new Date(2026, 0, 15, 12, 0, 0);

    testSeedService.bankPairExpense(
        { externalId: 'time-window-expense', operatedAt },
        { accountId: fromAccount.id, amount: 100 * PRECISION, toIban: 'UA-TO' }
    );
    testSeedService.bankPairIncome(
        { externalId: 'time-window-income', operatedAt: new Date(operatedAt.getTime() + incomeOffsetSeconds * 1000) },
        { accountId: toAccount.id, amount: 100 * PRECISION }
    );
};

describe('consolidation/time-window-boundary', () => {
    it('matches a pair right at the time-window edge', async () => {
        seedTimeWindowPair(TRANSFER_PAIR_TIME_WINDOW_SECONDS - 1);

        const result = await runConsolidation();
        expect(result.consolidated).toBe(1);
    });

    it('leaves a pair outside the time-window edge unconsolidated', async () => {
        seedTimeWindowPair(TRANSFER_PAIR_TIME_WINDOW_SECONDS + 60);

        const result = await runConsolidation();
        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
    });
});
