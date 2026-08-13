import { AccountTypeEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    expectConsolidationParent,
    expectRevertRestoresSources,
    fetchLedgerBalances,
    fetchLedgerEntry,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId
} from '../harness/consolidation-revert-audit';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

const ATM_WITHDRAWAL_AMOUNT = 500 * PRECISION;
const ATM_WITHDRAWAL_FEE_AMOUNT = 5 * PRECISION;
const ATM_CANONICAL_LEDGER_ENTRY_COUNT = 3;
const ATM_EXPENSE_LEDGER_ENTRY_COUNT = 2;
const ATM_MCC = '6011';
const ATM_OPERATED_AT = new Date('2026-05-20T18:38:00');

const seedAtmCashWithdrawalFixture = () => {
    const bankAccount = testSeedService.account({ title: 'Atm Bank', type: AccountTypeEnum.BANK_SYNC });
    const cashAccount = testSeedService.account({ title: 'Atm Cash', type: AccountTypeEnum.CASH });
    const expense = testSeedService.bankPairExpense(
        { externalId: 'tx-atm', operatedAt: ATM_OPERATED_AT },
        { accountId: bankAccount.id, amount: ATM_WITHDRAWAL_AMOUNT, mccCategoryId: testQueryService.findMccByCode(ATM_MCC).id }
    );

    testSeedService.feeEntry(expense.id, 'tx-atm-fee', { accountId: bankAccount.id, amount: ATM_WITHDRAWAL_FEE_AMOUNT });

    return { bankAccount, cashAccount, expense };
};

const fetchAtmCanonicalId = (): number => fetchSingleCanonicalId(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);

describe('consolidation/atm-cash-withdrawal', () => {
    it('promotes an ATM expense into a canonical transfer to cash and copies its fee entry', async () => {
        const { bankAccount, cashAccount, expense } = seedAtmCashWithdrawalFixture();

        const result = await runConsolidation();
        const canonicalId = fetchAtmCanonicalId();

        expect(result.consolidated).toBe(1);
        expectConsolidationParent(expense.id, canonicalId);
        expect(fetchOwnLedgerEntries(canonicalId)).toHaveLength(ATM_CANONICAL_LEDGER_ENTRY_COUNT);
        expect(fetchLedgerEntry(canonicalId, cashAccount.id).amount).toBe(ATM_WITHDRAWAL_AMOUNT);
        expect(await fetchLedgerBalances([bankAccount.id, cashAccount.id])).toEqual([
            [bankAccount.id, -(ATM_WITHDRAWAL_AMOUNT + ATM_WITHDRAWAL_FEE_AMOUNT)],
            [cashAccount.id, ATM_WITHDRAWAL_AMOUNT]
        ]);
    });

    it('restores the ATM expense with its fee entry and clears the cash balance when reverted', async () => {
        const { bankAccount, cashAccount, expense } = seedAtmCashWithdrawalFixture();

        await expectRevertRestoresSources({
            accountIds: [bankAccount.id, cashAccount.id],
            consolidationType: TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL,
            sourceTransactionIds: [expense.id]
        });

        expect(fetchOwnLedgerEntries(expense.id)).toHaveLength(ATM_EXPENSE_LEDGER_ENTRY_COUNT);
    });
});
