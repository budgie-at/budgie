import { AccountTypeEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    expectConsolidationParent,
    expectRevertRemovedCanonical,
    expectSourceStateRestored,
    fetchLedgerBalances,
    fetchLedgerEntry,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId,
    revertSingleCanonical,
    snapshotSourceState
} from '../harness/consolidation-revert-audit';
import { runConsolidation } from '../harness/run-consolidation';
import { consolidationCoordinatorService, testQueryService, testSeedService } from '../harness/test-context';

const ATM_WITHDRAWAL_AMOUNT = 500 * PRECISION;
const ATM_WITHDRAWAL_FEE_AMOUNT = 5 * PRECISION;
const ATM_CANONICAL_LEDGER_ENTRY_COUNT = 3;
const ATM_EXPENSE_LEDGER_ENTRY_COUNT = 2;
const ATM_MCC = '6011';
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const ATM_OPERATED_AT = new Date(Date.now() - DAY_MILLISECONDS);
const HISTORICAL_ATM_OPERATED_AT = new Date(Date.now() - 400 * DAY_MILLISECONDS);

const seedAtmExpense = (bankAccountId: number, externalId: string, operatedAt: Date) => {
    const expense = testSeedService.bankPairExpense(
        { externalId, operatedAt },
        { accountId: bankAccountId, amount: ATM_WITHDRAWAL_AMOUNT, mccCategoryId: testQueryService.findMccByCode(ATM_MCC).id }
    );

    testSeedService.feeEntry(expense.id, `${externalId}-fee`, { accountId: bankAccountId, amount: ATM_WITHDRAWAL_FEE_AMOUNT });

    return expense;
};

const seedAtmCashWithdrawalFixture = () => {
    const bankAccount = testSeedService.account({ title: 'Atm Bank', type: AccountTypeEnum.BANK_SYNC });
    const cashAccount = testSeedService.account({ title: 'Atm Cash', type: AccountTypeEnum.CASH });
    const expense = seedAtmExpense(bankAccount.id, 'tx-atm', ATM_OPERATED_AT);

    return { bankAccount, cashAccount, expense };
};

const fetchAtmCanonicalId = (): number => fetchSingleCanonicalId(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);

describe('consolidation/atm-cash-withdrawal', () => {
    it('never moves a recent or historical ATM expense to cash without the user', async () => {
        const { bankAccount, cashAccount, expense } = seedAtmCashWithdrawalFixture();
        const historicalExpense = seedAtmExpense(bankAccount.id, 'tx-atm-historical', HISTORICAL_ATM_OPERATED_AT);
        const balancesBefore = await fetchLedgerBalances([bankAccount.id, cashAccount.id]);

        expect(await runConsolidation()).toEqual({ consolidated: 0, found: 0 });
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(historicalExpense.id).consolidationParentTransactionId).toBeNull();
        expect(await fetchLedgerBalances([bankAccount.id, cashAccount.id])).toEqual(balancesBefore);
    });

    it('moves only the selected ATM expense to cash with its fee entry and ignores a repeated move', async () => {
        const { bankAccount, cashAccount, expense } = seedAtmCashWithdrawalFixture();
        const otherExpense = seedAtmExpense(bankAccount.id, 'tx-atm-other', ATM_OPERATED_AT);

        expect(await consolidationCoordinatorService.findAtmCashWithdrawalTransactionIds([expense.id])).toEqual([expense.id]);
        expect(await consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([expense.id])).toBe(1);

        const canonicalId = fetchAtmCanonicalId();

        expectConsolidationParent(expense.id, canonicalId);
        expect(testQueryService.fetchTransactionById(otherExpense.id).consolidationParentTransactionId).toBeNull();
        expect(fetchOwnLedgerEntries(canonicalId)).toHaveLength(ATM_CANONICAL_LEDGER_ENTRY_COUNT);
        expect(fetchLedgerEntry(canonicalId, cashAccount.id).amount).toBe(ATM_WITHDRAWAL_AMOUNT);
        expect(await fetchLedgerBalances([bankAccount.id, cashAccount.id])).toEqual([
            [bankAccount.id, -2 * (ATM_WITHDRAWAL_AMOUNT + ATM_WITHDRAWAL_FEE_AMOUNT)],
            [cashAccount.id, ATM_WITHDRAWAL_AMOUNT]
        ]);
        expect(await consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([expense.id])).toBe(0);
        expect(await runConsolidation()).toEqual({ consolidated: 0, found: 0 });
        expect(fetchAtmCanonicalId()).toBe(canonicalId);
    });

    it('does not move an ATM expense when its currency has no single active cash account', async () => {
        const { expense } = seedAtmCashWithdrawalFixture();
        testSeedService.account({ title: 'Second Cash', type: AccountTypeEnum.CASH });

        expect(await consolidationCoordinatorService.findAtmCashWithdrawalTransactionIds([expense.id])).toEqual([]);
        expect(await consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([expense.id])).toBe(0);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBeNull();
    });

    it('restores the ATM expense with its fee entry and clears the cash balance when reverted', async () => {
        const { bankAccount, cashAccount, expense } = seedAtmCashWithdrawalFixture();
        const stateBefore = snapshotSourceState([expense.id]);
        const balancesBefore = await fetchLedgerBalances([bankAccount.id, cashAccount.id]);

        await consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([expense.id]);

        expectRevertRemovedCanonical(await revertSingleCanonical(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL), [expense.id]);
        expectSourceStateRestored(stateBefore);
        expect(await fetchLedgerBalances([bankAccount.id, cashAccount.id])).toEqual(balancesBefore);
        expect(fetchOwnLedgerEntries(expense.id)).toHaveLength(ATM_EXPENSE_LEDGER_ENTRY_COUNT);
    });
});
