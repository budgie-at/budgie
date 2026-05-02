import { describe, expect, it } from 'vitest';

import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType } from '../../harness/fetch-canonicals';
import { fetchTransactionById } from '../../harness/fetch-by-id';
import { findMccByCode } from '../../harness/find-mcc';
import { seedBankExpense, seedBankIncome } from '../../harness/seed-bank-pair';
import { seedAccountPair } from '../../harness/seed-transfer-pair-fixture';
import { setupScenario } from '../../harness/setup-scenario';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

setupScenario();

const PRECISION = 1_000_000;

describe('consolidation/transfer-pair-by-amount', () => {
    it('falls back to amount + transfer-MCC matching when neither side has an IBAN', async () => {
        const { fromAccount, toAccount } = seedAccountPair();
        const transferMcc = findMccByCode('4829');

        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
        const expense = seedBankExpense({
            accountId: fromAccount.id,
            amount: 250 * PRECISION,
            operatedAt,
            externalId: 'tx-expense',
            mccCategoryId: transferMcc.id
        });
        const income = seedBankIncome({
            accountId: toAccount.id,
            amount: 250 * PRECISION,
            operatedAt: new Date(operatedAt.getTime() + 5_000),
            externalId: 'tx-income',
            mccCategoryId: transferMcc.id
        });

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
        seedBankExpense({ accountId: fromAccount.id, amount: 250 * PRECISION, operatedAt, externalId: 'tx-expense' });
        seedBankIncome({ accountId: toAccount.id, amount: 250 * PRECISION, operatedAt, externalId: 'tx-income' });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
    });
});
