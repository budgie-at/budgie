// Port of tests/app-tests/flows/31.debt-settlement-attachments.flow.yaml.
import { expect } from 'e2e';

import { exitAccountDetailsToHome, openAccountDetails, selectAccountBySearch } from '../support/budgie/accounts.ts';
import { selectCategory } from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import {
    enterComment,
    longPressTransactionAction,
    navigateToTransactions,
    openInfoConversions,
    openTransactionForm,
    selectAccount,
    submitTransactionAndReturnToList,
    typeDigits
} from '../support/budgie/transactions.ts';

const LENT = 'E2E Lent Debt';
const BORROWED = 'E2E Borrowed Debt';

test('31 debt settlement attachments', { tags: ['debt'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const card = (label: string) => `TransactionCard.Label.${label}`;
    const home = async () => {
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
    };
    const balances = async (account: string, ids: string[]) => {
        await openAccountDetails(ctx, account);
        for (const balance of ids) await b.expectId(ctx, `DebtAccountBalance.${balance}`);
    };
    /** Long-press a card, "Attach debt settlement", pick `account`. */
    const attachFromList = async (label: string, account: string, scroll = true) => {
        await navigateToTransactions(ctx);
        if (scroll) {
            await b.scrollTo(ctx, card(label));
            await b.sleep(400);
        } else {
            await b.expectId(ctx, card(label), 5_000);
        }
        await longPressTransactionAction(ctx, card(label), 'TransactionContextMenu.AttachDebtSettlementButton');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input', 10_000);
        await selectAccountBySearch(ctx, account);
    };
    /** From an edit form: actions menu, "Attach debt settlement", wait for the account sheet. */
    const attachFromForm = async () => {
        await b.tapId(ctx, 'TransactionActionsMenu.TriggerButton');
        await b.expectId(ctx, 'TransactionActionsMenu.AttachDebtSettlementButton');
        await b.sleep(400);
        await b.tapId(ctx, 'TransactionActionsMenu.AttachDebtSettlementButton');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input', 10_000);
    };
    const pickDebtWithTotal = async (account: string, total: string) => {
        await b.fillId(ctx, 'AccountPickerBottomSheet.Input', account);
        await b.expectId(ctx, `AccountPickerBottomSheet.Option.${account}`);
        await b.expectId(ctx, `AccountPickerBottomSheet.DebtTotal.${account}.${total}`);
        await b.tapId(ctx, `AccountPickerBottomSheet.Option.${account}`);
        await b.expectNoId(ctx, 'AccountPickerBottomSheet.Input');
    };
    const editIncome = async (txId: number) => {
        await navigateToTransactions(ctx);
        await b.openLink(ctx, `budgie://transactions/${txId}/income`);
        await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
        await b.tapId(ctx, 'TransactionInfo.EditButton.Label');
        await expect(b.byText(screen, 'Edit Income')).toBeVisible({ timeout: 10_000 });
        await b.sleep(400);
    };
    const borrowedFromHome = async () => {
        await home();
        await screen.scrollUntilVisible(id(`AccountCard.${BORROWED}`), { direction: 'up', timeout: 20_000 });
    };

    await budgie.start({ fixture: '31-debt.db' });

    await b.phase('attach expense to lent debt from the list', async () => {
        await attachFromList('E2E_Debt_Attach_Expense', 'E2E Lent Expense Debt', false);
        await b.expectId(ctx, card('E2E_Debt_Attach_Expense'), 5_000);
        await expect(id(card('E2E_Debt_Attach_Expense'))).toHaveText(/, From E2E Txn Account to E2E Lent Expense Debt,/, {
            timeout: 10_000
        });
        await home();
        await balances(LENT, ['OutstandingAmount.13000', 'PaidAmount.2000', 'TotalAmount.15000', 'Percentage.13_33']);
        await b.expectNoId(ctx, 'TransactionCard.Badge.Adjustment');
        await exitAccountDetailsToHome(ctx);
    });

    await b.phase('attach, detach, re-attach income from its info page', async () => {
        const income = card('E2E_Debt_Attach_Income');
        await navigateToTransactions(ctx);
        await b.expectId(ctx, income, 5_000);
        await b.tapId(ctx, income);
        await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
        await b.sleep(400);
        await b.expectNoId(ctx, 'TransactionInfo.Row.Debt');
        await openInfoConversions(ctx);
        await b.tapText(ctx, 'Attach debt');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input', 10_000);
        await pickDebtWithTotal(LENT, '15000');
        await b.scrollTo(ctx, 'TransactionInfo.Row.Debt', 'up');
        await expect(id('TransactionInfo.Row.Debt')).toContainText(LENT);
        await b.scrollTo(ctx, 'TransactionActionsMenu.DetachDebtSettlementButton');
        await b.expectId(ctx, 'TransactionActionsMenu.DetachDebtSettlementButton');
        await b.tapId(ctx, 'PageHeader.BackButton');

        await b.expectId(ctx, income, 5_000);
        await b.tapId(ctx, income);
        await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
        await b.sleep(400);
        await b.scrollTo(ctx, 'TransactionActionsMenu.DetachDebtSettlementButton');
        await b.tapId(ctx, 'TransactionActionsMenu.DetachDebtSettlementButton');
        await b.sleep(400);
        await b.scrollTo(ctx, 'TransactionInfo.Row.Account', 'up');
        await b.expectNoId(ctx, 'TransactionInfo.Row.Debt');
        await openInfoConversions(ctx);
        await b.expectId(ctx, 'TransactionActionsMenu.AttachDebtSettlementButton');
        await b.tapId(ctx, 'TransactionActionsMenu.AttachDebtSettlementButton');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input', 10_000);
        await selectAccountBySearch(ctx, LENT);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, income, 5_000);
        await expect(id(income)).toHaveText(/, Repayment · E2E Lent Debt,/);

        await home();
        await balances(LENT, ['OutstandingAmount.12905_933', 'PaidAmount.2094_067', 'TotalAmount.15000', 'Percentage.13_96']);
        await b.scrollTo(ctx, income);
        await b.expectId(ctx, income);
        await exitAccountDetailsToHome(ctx);
        await b.scrollTo(ctx, 'DebtAccountCardSummary.OutstandingAmount.E2E_Lent_Debt.12905_933');
        await b.expectId(ctx, 'DebtAccountCardSummary.TotalAmount.E2E_Lent_Debt.15000');
    });

    await b.phase('extra lending raises the lent total', async () => {
        await attachFromList('E2E_Lent_Debt_Extra_Lending', LENT);
        await expect(id(card('E2E_Lent_Debt_Extra_Lending'))).toHaveText(/, From E2E EUR Debt Funding Account,/, { timeout: 10_000 });
        await home();
        await balances(LENT, ['OutstandingAmount.13405_933', 'PaidAmount.2094_067', 'TotalAmount.15500', 'Percentage.13_51']);
        await exitAccountDetailsToHome(ctx);
        await b.scrollTo(ctx, 'DebtAccountCardSummary.OutstandingAmount.E2E_Lent_Debt.13405_933');
        await b.expectId(ctx, 'DebtAccountCardSummary.TotalAmount.E2E_Lent_Debt.15500');
    });

    await b.phase('borrowed debt: expense attached from its edit form', async () => {
        const expense = card('E2E_Borrowed_Debt_Attach_Expense');
        await navigateToTransactions(ctx);
        await b.scrollTo(ctx, expense);
        await b.sleep(400);
        await b.tapId(ctx, expense);
        await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
        await b.tapId(ctx, 'TransactionInfo.EditButton.Label');
        await expect(b.byText(screen, 'Edit Expense')).toBeVisible({ timeout: 10_000 });
        await b.sleep(400);
        await attachFromForm();
        await selectAccountBySearch(ctx, BORROWED);
        await expect(b.byText(screen, `Debt · ${BORROWED}`)).toBeVisible();
        await submitTransactionAndReturnToList(ctx);
        await b.scrollTo(ctx, expense);
        await expect(id(expense)).toHaveText(/, Repayment,/);
        await borrowedFromHome();
        await balances(BORROWED, ['OutstandingAmount.13274', 'PaidAmount.1726', 'TotalAmount.15000']);
        await exitAccountDetailsToHome(ctx);
    });

    await b.phase('borrowed debt: income attached from its edit form', async () => {
        await editIncome(12);
        await attachFromForm();
        await pickDebtWithTotal(BORROWED, '15000');
        await b.sleep(400);
        await expect(b.byText(screen, `Debt · ${BORROWED}`)).toBeVisible();
        await submitTransactionAndReturnToList(ctx);
        await b.scrollTo(ctx, card('E2E_Borrowed_Debt_Attach_Income'));
        await expect(id(card('E2E_Borrowed_Debt_Attach_Income'))).toHaveText(/, To E2E Txn Account,/);
        await borrowedFromHome();
        await balances(BORROWED, ['OutstandingAmount.13368_067', 'PaidAmount.1726', 'TotalAmount.15094_067', 'Percentage.11_43']);
        await exitAccountDetailsToHome(ctx);
    });

    await b.phase('completed debt: income attached', async () => {
        await editIncome(13);
        await attachFromForm();
        await selectAccountBySearch(ctx, 'E2E Completed Debt');
        await expect(b.byText(screen, 'Debt · E2E Completed Debt')).toBeVisible();
        await submitTransactionAndReturnToList(ctx);
        await b.scrollTo(ctx, card('E2E_Completed_Debt_Attach_Income'));
        await expect(id(card('E2E_Completed_Debt_Attach_Income'))).toHaveText(/, (Repayment|To E2E Txn Account),/);
        await home();
        await b.openLink(ctx, 'budgie://account/7/details');
        await b.expectId(ctx, 'AccountDetails.Page', 10_000);
        await b.expectId(ctx, 'DebtAccountBalance.PaidAmount.258_9', 10_000);
        for (const balance of ['OutstandingAmount.41_1', 'TotalAmount.300', 'Percentage.86_3'])
            await b.expectId(ctx, `DebtAccountBalance.${balance}`);
        await exitAccountDetailsToHome(ctx);
    });

    await b.phase('expense with a fee attached to lent debt', async () => {
        await attachFromList('E2E_Fee_Debt_Attach_Expense', LENT);
        await b.expectId(ctx, card('E2E_Fee_Debt_Attach_Expense'), 5_000);
        await expect(id(card('E2E_Fee_Debt_Attach_Expense'))).toHaveText(/, From E2E Txn Account to E2E Lent Debt,/);
        await home();
        await balances(LENT, ['OutstandingAmount.13492_233', 'PaidAmount.2094_067', 'TotalAmount.15586_3', 'Percentage.13_44']);
        await exitAccountDetailsToHome(ctx);
    });

    await b.phase('cross-currency expense attached to borrowed debt', async () => {
        await attachFromList('E2E_Cross_Currency_Debt_Attach', BORROWED);
        await b.expectId(ctx, card('E2E_Cross_Currency_Debt_Attach'), 5_000);
        await expect(id(card('E2E_Cross_Currency_Debt_Attach'))).toHaveText(/, Repayment · E2E Borrowed Debt,/);
        await home();
        await balances(BORROWED, ['OutstandingAmount.13281_767', 'PaidAmount.1812_3', 'TotalAmount.15094_067', 'Percentage.12_01']);
        await exitAccountDetailsToHome(ctx);
    });

    await b.phase('new Lending-category expense attached', async () => {
        const label = card('E2E_Debt_Category_Attach');
        await navigateToTransactions(ctx);
        await openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
        await typeDigits(ctx, '100');
        await selectAccount(ctx, 'E2E Txn Account');
        await selectCategory(ctx, 'Lending');
        await enterComment(ctx, 'E2E Debt Category Attach');
        await submitTransactionAndReturnToList(ctx);
        await b.scrollTo(ctx, label, 'up');
        await b.expectId(ctx, 'TransactionCard.Category.Lending');
        await longPressTransactionAction(ctx, label, 'TransactionContextMenu.AttachDebtSettlementButton');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input', 10_000);
        await selectAccountBySearch(ctx, LENT);
        await expect(b.byText(screen, 'From E2E Txn Account to E2E Lent Debt')).toBeVisible({ timeout: 10_000 });
    });
});
