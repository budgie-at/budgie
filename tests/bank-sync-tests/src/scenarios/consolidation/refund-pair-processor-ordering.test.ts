import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, findMccByCode, seedAccountPair, seedBankPair } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-processor-ordering', () => {
    it('lets the transfer-pair processor reparent first when an income is also a transfer-pair partner', async () => {
        const { fromAccount, toAccount } = seedAccountPair();
        const transferMcc = findMccByCode('4829');
        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);

        const expense = seedBankPair.expense(
            { externalId: 'tx-expense', operatedAt },
            { accountId: fromAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
        );
        const income = seedBankPair.income(
            { externalId: 'tx-income', operatedAt: new Date(operatedAt.getTime() + 5_000) },
            { accountId: toAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
        );

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(1);

        const transferCanonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(transferCanonicals).toHaveLength(1);

        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(transferCanonicals[0].id);
        expect(fetchTransactionById(income.id).consolidationParentTransactionId).toBe(transferCanonicals[0].id);

        const refundCanonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.REFUND);
        expect(refundCanonicals).toHaveLength(0);
    });
});
