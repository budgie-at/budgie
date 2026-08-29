import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { fetchCanonicalsOfType, seed, seedBankPair } from '../../harness';

const seedScopedTransferPair = (
    externalIdPrefix: string,
    operatedAt: Date,
    fromAccountId: number,
    toAccountId: number
): { readonly expenseId: number; readonly incomeId: number } => {
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

const seedWindowTransferPairs = () => {
    const { fromAccount, toAccount } = seed.accountPair('UA-FROM', 'UA-TO');
    const oldOperatedAt = new Date(2025, 0, 15, 12, 0, 0);
    const newOperatedAt = new Date(2026, 0, 15, 12, 0, 0);

    seedScopedTransferPair('old', oldOperatedAt, fromAccount.id, toAccount.id);

    return {
        changedPair: seedScopedTransferPair('new', newOperatedAt, fromAccount.id, toAccount.id),
        newOperatedAt
    };
};

describe('consolidation/bounded-consolidation-scope', () => {
    it('limits a bank-sync triggered scan to candidates inside the provided operated-at scope', async () => {
        const { changedPair, newOperatedAt } = seedWindowTransferPairs();

        const result = await transferConsolidationService.consolidate({
            operatedAtFrom: new Date(newOperatedAt.getTime() - 60_000),
            operatedAtTo: new Date(newOperatedAt.getTime() + 60_000),
            transactionIds: [changedPair.expenseId, changedPair.incomeId]
        });

        expect(result).toEqual({ found: 1, consolidated: 1 });
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });

    it('keeps settings-triggered consolidation global when no scope is provided', async () => {
        seedWindowTransferPairs();

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 2, consolidated: 2 });
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(2);
    });
});
