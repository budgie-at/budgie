import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { AccountTypeEnum, TransactionConsolidationTypeEnum, TransactionEntryEntityTable } from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, findMccByCode, seed, seedBankPair, testDb } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { transactionService } from '@app/transaction/service/transaction.service';

const PRECISION = 1_000_000;

const seedAtmExpense = (bankAccountId: number) =>
    seedBankPair.expense(
        { externalId: 'tx-atm', operatedAt: new Date(2026, 0, 15, 12, 0, 0) },
        { accountId: bankAccountId, amount: 500 * PRECISION, mccCategoryId: findMccByCode('6011').id }
    );

describe('consolidation/atm-cash-withdrawal', () => {
    it('promotes an MCC=6011 expense into a TRANSFER to the unique cash account in the same currency', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
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
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        seed.account({ title: 'Cash 1', type: AccountTypeEnum.CASH, instrumentId: 1 });
        seed.account({ title: 'Cash 2', type: AccountTypeEnum.CASH, instrumentId: 1 });
        seedAtmExpense(bankAccount.id);

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
    });

    it('reverts an ATM cash withdrawal canonical and restores the source expense', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
        const expense = seedAtmExpense(bankAccount.id);

        await transferConsolidationService.consolidate();

        const canonical = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)[0];
        expect(canonical).toBeDefined();

        await transactionService.unconsolidateById(canonical.id);

        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toHaveLength(0);
        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBeNull();

        const restoredEntries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, expense.id))
            .all();
        expect(restoredEntries).toHaveLength(1);
        expect(restoredEntries[0].originalTransactionId).toBeNull();

        const leftoverEntries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, canonical.id))
            .all();
        expect(leftoverEntries).toHaveLength(0);
    });
});
