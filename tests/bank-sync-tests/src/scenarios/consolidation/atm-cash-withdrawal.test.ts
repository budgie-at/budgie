import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { MccCategoryEntityTable, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, seed, seedBankExpense, setupScenario, testDb } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

setupScenario();

const PRECISION = 1_000_000;

const findCashierMccId = (): number => testDb.select().from(MccCategoryEntityTable).where(eq(MccCategoryEntityTable.mcc, '6011')).all()[0].id;

const seedAtmExpense = (bankAccountId: number) =>
    seedBankExpense({
        accountId: bankAccountId,
        amountMicro: 500 * PRECISION,
        operatedAt: new Date(2026, 0, 15, 12, 0, 0),
        externalId: 'tx-atm',
        mccCategoryId: findCashierMccId()
    });

describe('consolidation/atm-cash-withdrawal', () => {
    it('promotes an MCC=6011 expense into a TRANSFER to the unique cash account in the same currency', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: 'BANK_SYNC', instrumentId: 1 });
        const cashAccount = seed.account({ title: 'Cash', type: 'CASH', instrumentId: 1 });
        const expense = seedAtmExpense(bankAccount.id);

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(1);

        const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);
        expect(canonicals).toHaveLength(1);
        expect(canonicals[0].fromAccountId).toBe(bankAccount.id);
        expect(canonicals[0].toAccountId).toBe(cashAccount.id);

        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonicals[0].id);
    });

    it('does NOT auto-consolidate when more than one cash account shares the currency', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: 'BANK_SYNC', instrumentId: 1 });
        seed.account({ title: 'Cash 1', type: 'CASH', instrumentId: 1 });
        seed.account({ title: 'Cash 2', type: 'CASH', instrumentId: 1 });
        seedAtmExpense(bankAccount.id);

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
    });
});
