import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('11 cross currency transfer transaction', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const home = async (txn: string, foreign: string) => {
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'HomePage.TotalBalance');
        await b.expectId(ctx, `AccountCard.Balance.E2E_Txn_Account.${txn}`);
        await b.expectId(ctx, `AccountCard.Balance.E2E_Foreign_Account.${foreign}`);
    };
    const transactionsTab = async () => {
        await b.tapId(ctx, 'TabBar.Transactions');
        await b.expectId(ctx, 'TransactionsPage.Container', 15_000);
    };

    await budgie.start({ fixture: '11.db' });

    await b.phase('create cross-currency transfer', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransactionForm(ctx, 'ActionItem.Transfer', 'New Transfer');
        await t.typeDigits(ctx, '75');
        await t.pickTransferAccount(ctx, 'TransferForm.FromAccount', 'E2E Txn Account');
        await t.pickTransferAccount(ctx, 'TransferForm.ToAccount', 'E2E Foreign Account');
        await b.expectId(ctx, 'TransferForm.ConversionRow');
        await t.enterComment(ctx, 'E2E Cross Currency Transfer');
        await t.submitTransactionAndWait(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Cross_Currency_Transfer', 5_000);
        await home('25', '165');
        await transactionsTab();
    });

    await b.phase('edit cross-currency transfer', async () => {
        await t.openTransaction(ctx, 'E2E_Cross_Currency_Transfer');
        await b.expectId(ctx, 'TransactionInfo.Row.FromAccount');
        await b.expectId(ctx, 'TransactionInfo.Row.ToAccount');
        await b.expectId(ctx, 'TransactionInfo.Row.ExchangeRate');
        await b.tapId(ctx, 'TransactionInfo.EditButton.Label');
        await b.expectId(ctx, 'TransferForm.ConversionRow', 5_000);
        await t.clearAmount(ctx);
        await t.typeDigits(ctx, '50');
        await b.expectText(ctx, /43\.15/);
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'TransactionInfo.Page', 15_000);
        await b.expectId(ctx, 'TransactionInfo.Row.ExchangeRate');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Cross_Currency_Transfer', 5_000);
        await home('50', '143');
        await b.expectId(ctx, 'HomePage.NetWorthValue.216');
        await transactionsTab();
    });

    await b.phase('preserve the manual rate after changing the source amount', async () => {
        await t.openTransaction(ctx, 'E2E_Cross_Currency_Transfer');
        await b.tapId(ctx, 'TransactionInfo.EditButton.Label');
        await b.tapId(ctx, 'TransferForm.ConversionRow');
        await t.clearAmount(ctx);
        await t.typeDigits(ctx, '45');
        await b.tapId(ctx, 'TransactionKeypad.Dismiss');
        await b.expectNoId(ctx, 'TransactionKeypad.Digit.1');
        await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toContainText('Save');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'TransactionInfo.Page', 15_000);
        await b.tapId(ctx, 'TransactionInfo.EditButton.Label');
        await expect(b.byId(ctx.screen, 'TransferForm.ConversionRow')).toContainText('45');
        await t.clearAmount(ctx);
        await t.typeDigits(ctx, '25');
        await b.expectText(ctx, /22\.50/);
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'TransactionInfo.Page', 15_000);
        await b.tapId(ctx, 'TransactionInfo.EditButton.Label');
        await b.expectText(ctx, /22\.50/);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionInfo.Page');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await home('75', '122');
        await transactionsTab();
    });

    await b.phase('delete cross-currency transfer', async () => {
        await t.openTransaction(ctx, 'E2E_Cross_Currency_Transfer');
        await t.deleteTransaction(ctx);
        await t.navigateToTransactions(ctx);
        await b.expectNoId(ctx, 'TransactionCard.Label.E2E_Cross_Currency_Transfer');
        await b.expectId(ctx, 'TabBar.Home', 3_000);
        await home('100', '100');
    });
});
