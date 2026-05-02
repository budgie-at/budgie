import { describe, expect, it } from 'vitest';

import { TRANSFER_PAIR_TIME_WINDOW_SECONDS, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType, seedAccountPair, seedBankExpense, seedBankIncome } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

const PRECISION = 1_000_000;

const seedTimeWindowPair = (incomeOffsetSeconds: number): void => {
    const { fromAccount, toAccount } = seedAccountPair('UA-FROM', 'UA-TO');
    const operatedAt = new Date(2026, 0, 15, 12, 0, 0);

    seedBankExpense({
        accountId: fromAccount.id,
        amount: 100 * PRECISION,
        operatedAt,
        externalId: 'tx-expense',
        toIban: 'UA-TO'
    });
    seedBankIncome({
        accountId: toAccount.id,
        amount: 100 * PRECISION,
        operatedAt: new Date(operatedAt.getTime() + incomeOffsetSeconds * 1000),
        externalId: 'tx-income'
    });
};

describe('consolidation/time-window-boundary', () => {
    it('matches a pair right at the time-window edge', async () => {
        seedTimeWindowPair(TRANSFER_PAIR_TIME_WINDOW_SECONDS - 1);

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(1);
    });

    it('does NOT match a pair past the time-window edge', async () => {
        seedTimeWindowPair(TRANSFER_PAIR_TIME_WINDOW_SECONDS + 60);

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
    });
});
