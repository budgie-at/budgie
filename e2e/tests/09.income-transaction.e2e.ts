import { expect } from 'e2e';

import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('09 income transaction', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const home = async (amount: string) => {
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'HomePage.TotalBalance');
        await b.expectId(ctx, `HomePage.NetWorthValue.${amount}`);
        await b.expectId(ctx, `AccountCard.Balance.E2E_Txn_Account.${amount}`);
    };

    await budgie.start({ fixture: '09.db' });

    await b.phase('create income', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransactionForm(ctx, 'ActionItem.Income', 'New Income');
        await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
        await t.typeDigits(ctx, '100');
        await t.selectAccount(ctx, 'E2E Txn Account');
        await c.selectCategory(ctx, 'E2E Txn Category');
        await t.enterComment(ctx, 'E2E Test Income');
        await t.submitTransactionAndWait(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Test_Income', 5_000);
        await home('200');
        await t.navigateToTransactions(ctx);
    });

    await b.phase('edit income', async () => {
        await t.openTransaction(ctx, 'E2E_Test_Income');
        await b.expectId(ctx, 'TransactionInfo.Row.Account');
        await b.expectId(ctx, 'TransactionInfo.Row.Category');
        await b.expectNoId(ctx, 'TransactionFeePill');
        await b.scrollTo(ctx, 'TransactionActionsMenu.CreateRuleButton');
        await b.expectId(ctx, 'TransactionInfo.ConvertButton');
        await b.expectId(ctx, 'TransactionActionsMenu.CreateRuleButton');
        await b.tapId(ctx, 'TransactionInfo.ConvertButton');
        await b.expectText(ctx, 'Add fee');
        await b.expectText(ctx, 'Attach debt');
        await b.expectText(ctx, 'Convert to Refund');
        await b.expectText(ctx, 'Convert to Transfer');
        await expect(b.byText(screen, 'Start Deposit')).toBeHidden();

        await b.tapText(ctx, 'Add fee');
        await t.openAndDismissFeeSheet(ctx, 'Edit Income');
        await b.tapId(ctx, 'TransactionActionsMenu.TriggerButton');
        await b.expectId(ctx, 'TransactionActionsMenu.FeeButton');
        await b.expectId(ctx, 'TransactionActionsMenu.DeleteButton');
        await b.expectId(ctx, 'TransactionActionsMenu.AttachDebtSettlementButton');
        await b.expectId(ctx, 'TransactionActionsMenu.ConvertToRefundButton');
        await b.expectId(ctx, 'TransactionActionsMenu.ConvertToTransferButton');
        await b.expectNoId(ctx, 'TransactionActionsMenu.StartDepositButton');
        await b.expectNoId(ctx, 'TransactionActionsMenu.RevertButton');
        await b.tapId(ctx, 'TransactionActionsMenu.TriggerButton');

        await t.clearAmount(ctx);
        await t.typeDigits(ctx, '125');
        await t.editComment(ctx, 'E2E Edited Income');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'TransactionInfo.Page', 15_000);
        await b.expectId(ctx, 'TransactionInfo.Row.Account');
        await b.expectId(ctx, 'TransactionInfo.Row.Category');
        await t.navigateToTransactions(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Edited_Income', 5_000);
        await b.expectId(ctx, 'TabBar.Home', 3_000);
        await home('225');
        await t.navigateToTransactions(ctx);
    });

    await b.phase('delete income', async () => {
        await t.openTransaction(ctx, 'E2E_Edited_Income');
        await t.deleteTransaction(ctx);
        await t.navigateToTransactions(ctx);
        await b.expectNoId(ctx, 'TransactionCard.Label.E2E_Edited_Income', 5_000);
        await b.expectId(ctx, 'TabBar.Home', 3_000);
        await home('100');
    });
});
