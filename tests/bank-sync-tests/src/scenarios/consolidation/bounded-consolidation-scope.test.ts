import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType, seedAccountPair, seedBankPair } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

const seedScopedTransferPair = (
    externalIdPrefix: string,
    operatedAt: Date,
    fromAccountId: number,
    toAccountId: number
): { expenseId: number; incomeId: number } => {
    const expense = seedBankPair.expense(
        { externalId: `${externalIdPrefix}-expense`, operatedAt },
        { accountId: fromAccountId, amount: 100 * PRECISION, toIban: 'UA-TO' }
    );
    const income = seedBankPair.income(
        { externalId: `${externalIdPrefix}-income`, operatedAt },
        { accountId: toAccountId, amount: 100 * PRECISION }
    );

    return { expenseId: expense.id, incomeId: income.id };
};

describe('consolidation/bounded-consolidation-scope', () => {
    it('limits a bank-sync triggered scan to candidates inside the provided operated-at scope', async () => {
        const { fromAccount, toAccount } = seedAccountPair('UA-FROM', 'UA-TO');
        const oldOperatedAt = new Date(2025, 0, 15, 12, 0, 0);
        const newOperatedAt = new Date(2026, 0, 15, 12, 0, 0);

        seedScopedTransferPair('old', oldOperatedAt, fromAccount.id, toAccount.id);
        const changedPair = seedScopedTransferPair('new', newOperatedAt, fromAccount.id, toAccount.id);

        const result = await transferConsolidationService.consolidate({
            operatedAtFrom: new Date(newOperatedAt.getTime() - 60_000),
            operatedAtTo: new Date(newOperatedAt.getTime() + 60_000),
            transactionIds: [changedPair.expenseId, changedPair.incomeId]
        });

        expect(result).toEqual({ found: 1, consolidated: 1 });
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });

    it('keeps settings-triggered consolidation global when no scope is provided', async () => {
        const { fromAccount, toAccount } = seedAccountPair('UA-FROM', 'UA-TO');
        const oldOperatedAt = new Date(2025, 0, 15, 12, 0, 0);
        const newOperatedAt = new Date(2026, 0, 15, 12, 0, 0);

        seedScopedTransferPair('old', oldOperatedAt, fromAccount.id, toAccount.id);
        seedScopedTransferPair('new', newOperatedAt, fromAccount.id, toAccount.id);

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 2, consolidated: 2 });
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(2);
    });
});
