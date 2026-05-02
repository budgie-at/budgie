import { describe, expect, it } from 'vitest';

import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, findMccByCode, seedAccountPair, seedBankPair } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

const PRECISION = 1_000_000;

describe('consolidation/transfer-pair-by-amount', () => {
    it('falls back to amount + transfer-MCC matching when neither side has an IBAN', async () => {
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

        const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);

        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonicals[0].id);
    });

    it('does NOT consolidate when amounts match but neither IBAN nor transfer-MCC is present', async () => {
        const { fromAccount, toAccount } = seedAccountPair();
        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
        seedBankPair.expense({ externalId: 'tx-expense', operatedAt }, { accountId: fromAccount.id, amount: 250 * PRECISION });
        seedBankPair.income({ externalId: 'tx-income', operatedAt }, { accountId: toAccount.id, amount: 250 * PRECISION });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
    });
});
