import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const TARGET = 'E2E Expense Target';

test('12 account archive and expense convert to transfer', { tags: ['accounts', 'transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const home = async (netWorth: string, source: string, target: string) => {
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'HomePage.TotalBalance');
        await b.expectId(ctx, `HomePage.NetWorthValue.${netWorth}`);
        await b.expectId(ctx, `AccountCard.Balance.E2E_Expense_Source.${source}`);
        await b.expectId(ctx, `AccountCard.Balance.E2E_Expense_Target.${target}`);
    };

    await budgie.start({ fixture: '12.db' });

    await b.phase('archive and restore existing account', async () => {
        await b.tapUntil(ctx, `AccountCard.${TARGET}`, () => b.expectId(ctx, 'AccountDetails.ActionsButton', 10_000));
        await b.expectId(ctx, 'AccountDetails.ActionsButton', 20_000);
        await b.tapId(ctx, 'AccountDetails.ActionsButton');
        await b.tapId(ctx, 'AccountDetails.EditButton');
        await b.expectId(ctx, 'AccountForm.NameInput', 10_000);
        await b.scrollTo(ctx, 'AccountDetails.ArchiveButton');
        await b.tapId(ctx, 'AccountDetails.ArchiveButton');
        await b.expectNoId(ctx, `AccountCard.${TARGET}`, 10_000);

        await a.openArchivedAccounts(ctx);
        await b.expectId(ctx, `ArchivedAccountCard.RestoreButton.${TARGET}`, 10_000);
        await b.tapId(ctx, `ArchivedAccountCard.RestoreButton.${TARGET}`);
        await b.expectNoId(ctx, `ArchivedAccountCard.RestoreButton.${TARGET}`, 10_000);
        // A finger held on a toast past its timeout must not leave it on screen for good.
        await b.byId(ctx.screen, b.TOAST).longPress({ duration: 6_000 });
        await b.expectNoId(ctx, b.TOAST, 3_000);
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        await b.expectId(ctx, `AccountCard.${TARGET}`);
    });

    await b.phase('create expense', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
        // A keypad tap can land while the form is still settling and be dropped: re-enter until the amount reads 30.
        await b.retry(2, async () => {
            await t.clearAmount(ctx);
            await t.typeDigits(ctx, '30');
            await expect(b.byId(ctx.screen, 'TransactionForm.AmountInput')).toHaveText(/^\$\s*30$/, { timeout: 2_000 });
        });
        await t.selectAccount(ctx, 'E2E Expense Source');
        await c.createCategoryFromTransaction(ctx, 'E2E Convert Category');
        await t.enterComment(ctx, 'E2E Convert Expense');
        await t.submitTransactionAndWait(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Convert_Expense', 5_000);
        await home('170', '70', '100');
    });

    await b.phase('convert expense to transfer', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransaction(ctx, 'E2E_Convert_Expense');
        await t.openInfoConversions(ctx);
        await b.tapText(ctx, 'Convert to Transfer');
        await b.expectId(ctx, 'ConvertToTransfer.Page');
        await b.expectNoId(ctx, 'TransactionKeypad.Digit.1');
        await b.expectId(ctx, 'TransactionForm.SubmitButton');
        await b.tapId(ctx, 'TransactionForm.AmountInput');
        await b.expectId(ctx, 'TransactionKeypad.Digit.1');
        await b.expectId(ctx, 'TransactionForm.SubmitButton');
        await b.tapId(ctx, 'TransactionForm.AmountInput');
        await b.expectNoId(ctx, 'TransactionKeypad.Digit.1');
        await b.expectId(ctx, 'TransactionForm.SubmitButton');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'ConvertToTransfer.Page');
        await b.tapId(ctx, 'TransferForm.ToAccount');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input');
        await a.selectAccountFromNativePicker(ctx, `AccountPickerBottomSheet.Option.${TARGET}`);
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectNoId(ctx, 'ConvertToTransfer.Page', 15_000);
        await b.expectId(ctx, 'TransactionInfo.Page', 3_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionsPage.Container', 10_000);
        await b.expectNoId(ctx, 'HomePage.TotalBalance');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Convert_Expense');
        await b.expectText(ctx, /^From E2E Expense Source to E2E Expense Target/i);
        await home('200', '70', '130');
    });

    await b.phase('delete transfer', async () => {
        await t.navigateToTransactions(ctx);
        await b.tapId(ctx, 'TransactionCard.Label.E2E_Convert_Expense');
        await t.deleteTransaction(ctx);
        await t.navigateToTransactions(ctx);
        await b.expectNoId(ctx, 'TransactionCard.Label.E2E_Convert_Expense', 10_000);
        await b.expectId(ctx, 'TabBar.Home', 10_000);
        await home('200', '100', '100');
    });
});
