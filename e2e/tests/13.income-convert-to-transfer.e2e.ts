import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('13 income convert to transfer', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const home = async (netWorth: string, target: string, source: string) => {
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'HomePage.TotalBalance');
        await b.expectId(ctx, `HomePage.NetWorthValue.${netWorth}`);
        await b.expectId(ctx, `AccountCard.Balance.E2E_Income_Target.${target}`);
        await b.expectId(ctx, `AccountCard.Balance.E2E_Income_Source.${source}`);
    };

    await budgie.start({ fixture: '13.db' });

    await b.phase('create income', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransactionForm(ctx, 'ActionItem.Income', 'New Income');
        await t.typeDigits(ctx, '030');
        await t.selectAccount(ctx, 'E2E Income Target');
        await c.createCategoryFromTransaction(ctx, 'E2E Income Convert Category');
        await t.enterComment(ctx, 'E2E Convert Income');
        await t.submitTransactionAndWait(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Convert_Income', 5_000);
        await home('230', '130', '100');
    });

    await b.phase('convert income to transfer', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransaction(ctx, 'E2E_Convert_Income');
        await t.openInfoConversions(ctx);
        await b.tapText(ctx, 'Convert to Transfer');
        await b.expectId(ctx, 'ConvertToTransfer.Page');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'ConvertToTransfer.Page');
        await b.tapId(ctx, 'TransferForm.FromAccount');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input');
        await a.selectAccountFromNativePicker(ctx, 'AccountPickerBottomSheet.Option.E2E Income Source');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectNoId(ctx, 'ConvertToTransfer.Page', 15_000);
        await b.expectId(ctx, 'TransactionInfo.Page', 15_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionsPage.Container', 10_000);
        await b.expectNoId(ctx, 'HomePage.TotalBalance');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Convert_Income');
        await b.expectText(ctx, /From E2E Income Source to E2E Income Target/i);
        await home('200', '130', '70');
    });

    await b.phase('delete transfer', async () => {
        await t.navigateToTransactions(ctx);
        await b.tapId(ctx, 'TransactionCard.Label.E2E_Convert_Income');
        await t.deleteTransaction(ctx);
        await t.navigateToTransactions(ctx);
        await b.expectNoId(ctx, 'TransactionCard.Label.E2E_Convert_Income', 10_000);
        await b.expectId(ctx, 'TabBar.Home', 10_000);
        await home('200', '100', '100');
    });
});

test('13 income conversion preserves the original amount with a manual foreign amount', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '11.db' });

    await b.phase('create original dollar income', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransactionForm(ctx, 'ActionItem.Income', 'New Income');
        await t.typeDigits(ctx, '030');
        await t.selectAccount(ctx, 'E2E Txn Account');
        await c.createCategoryFromTransaction(ctx, 'E2E FX Income Category');
        await t.enterComment(ctx, 'E2E Manual FX Income');
        await t.submitTransactionAndWait(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Manual_FX_Income');
    });

    await b.phase('cancel conversion without changing the income', async () => {
        await t.openTransaction(ctx, 'E2E_Manual_FX_Income');
        await t.openInfoConversions(ctx);
        await b.tapText(ctx, 'Convert to Transfer');
        await b.tapId(ctx, 'TransferForm.FromAccount');
        await a.selectAccountFromNativePicker(ctx, 'AccountPickerBottomSheet.Option.E2E Foreign Account');
        await b.tapText(ctx, 'Cancel');
        await b.expectNoId(ctx, 'ConvertToTransfer.Page');
        await expect(b.byId(ctx.screen, 'TransactionInfo.Amount')).toHaveText('+$30.00');
        await b.expectId(ctx, 'TransactionInfo.Row.Account');
        await b.expectId(ctx, 'TransactionInfo.Row.Category');
        await b.expectNoId(ctx, 'TransactionInfo.Row.FromAccount');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionsPage.Container');
    });

    await b.phase('convert using a manual foreign sending amount', async () => {
        await t.openTransaction(ctx, 'E2E_Manual_FX_Income');
        await t.openInfoConversions(ctx);
        await b.tapText(ctx, 'Convert to Transfer');
        await b.expectId(ctx, 'ConvertToTransfer.Page');
        await expect(b.byId(ctx.screen, 'ConvertToTransfer.OriginalAmount')).toHaveText('$30.00');
        await b.tapId(ctx, 'TransferForm.FromAccount');
        await a.selectAccountFromNativePicker(ctx, 'AccountPickerBottomSheet.Option.E2E Foreign Account');
        await b.tapId(ctx, 'TransferForm.ConversionRow');
        await t.clearAmount(ctx);
        await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
        await t.typeDigits(ctx, '25');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectNoId(ctx, 'TransactionKeypad.Digit.1');
        await expect(b.byId(ctx.screen, 'ConvertToTransfer.OriginalAmount')).toHaveText('$30.00');
        await b.expectText(ctx, /25\.00/);
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectNoId(ctx, 'ConvertToTransfer.Page', 15_000);
        await b.expectId(ctx, 'TransactionInfo.Page');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionsPage.Container');
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Txn_Account.130');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Foreign_Account.75');
    });

    await b.phase('delete the converted foreign transfer', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransaction(ctx, 'E2E_Manual_FX_Income');
        await t.deleteTransaction(ctx);
        await t.navigateToTransactions(ctx);
        await b.expectNoId(ctx, 'TransactionCard.Label.E2E_Manual_FX_Income');
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Txn_Account.100');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Foreign_Account.100');
    });
});
