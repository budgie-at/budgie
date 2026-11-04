import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('10 transfer transaction', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const home = async (txn: string, transfer: string) => {
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'HomePage.TotalBalance');
        await b.expectId(ctx, 'HomePage.NetWorthValue.200');
        await b.expectId(ctx, `AccountCard.Balance.E2E_Txn_Account.${txn}`);
        await b.expectId(ctx, `AccountCard.Balance.E2E_Transfer_Account.${transfer}`);
    };
    const pickAccount = async (selector: string, name: string) => {
        await b.tapId(ctx, selector);
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input');
        await a.selectAccountBySearch(ctx, name);
    };
    const menuWithoutConversions = async () => {
        await b.expectNoId(ctx, 'TransactionActionsMenu.AttachDebtSettlementButton');
        await b.expectNoId(ctx, 'TransactionActionsMenu.ConvertToRefundButton');
        await b.expectNoId(ctx, 'TransactionActionsMenu.ConvertToTransferButton');
        await b.expectNoId(ctx, 'TransactionActionsMenu.RevertButton');
    };

    await budgie.start({ fixture: '10.db' });

    await b.phase('create transfer', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransactionForm(ctx, 'ActionItem.Transfer', 'New Transfer');
        await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
        await t.typeDigits(ctx, '50');
        await pickAccount('TransferForm.FromAccount', 'E2E Txn Account');
        await pickAccount('TransferForm.ToAccount', 'E2E Transfer Account');
        await t.enterComment(ctx, 'E2E Test Transfer');
        await t.submitTransactionAndWait(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Test_Transfer', 5_000);
        await home('50', '150');
        await t.navigateToTransactions(ctx);
    });

    await b.phase('edit transfer', async () => {
        await t.openTransaction(ctx, 'E2E_Test_Transfer');
        await b.expectNoId(ctx, 'TransactionFeePill');
        await b.scrollTo(ctx, 'TransactionActionsMenu.CreateRuleButton');
        await b.expectId(ctx, 'TransactionInfo.ConvertButton');
        await b.expectId(ctx, 'TransactionActionsMenu.CreateRuleButton');
        await menuWithoutConversions();
        await b.tapId(ctx, 'TransactionInfo.ConvertButton');
        await b.tapId(ctx, 'TransactionActionsMenu.FeeButton');
        await t.openAndDismissFeeSheet(ctx, 'Edit Transfer');
        await b.tapId(ctx, 'TransactionActionsMenu.TriggerButton');
        await b.expectId(ctx, 'TransactionActionsMenu.FeeButton');
        await b.expectId(ctx, 'TransactionActionsMenu.DeleteButton');
        await menuWithoutConversions();
        await b.tapId(ctx, 'TransactionActionsMenu.TriggerButton');

        await b.expectId(ctx, 'TransferForm.SelectedFromAccount.E2E Txn Account');
        await b.expectId(ctx, 'TransferForm.SelectedToAccount.E2E Transfer Account');
        await b.tapId(ctx, 'TransferForm.SwapAccounts');
        await b.expectId(ctx, 'TransferForm.SelectedFromAccount.E2E Transfer Account');
        await b.expectId(ctx, 'TransferForm.SelectedToAccount.E2E Txn Account');

        await t.clearAmount(ctx);
        await t.typeDigits(ctx, '25');
        await t.editComment(ctx, 'E2E Edited Transfer');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'TransactionInfo.Page', 3_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Edited_Transfer', 5_000);
        await expect(b.byId(screen, 'TransactionCard.Label.E2E_Edited_Transfer')).toHaveText(
            /From E2E Transfer Account to E2E Txn Account/i
        );
        await home('125', '75');
        await t.navigateToTransactions(ctx);
    });

    await b.phase('delete transfer', async () => {
        await t.openTransaction(ctx, 'E2E_Edited_Transfer');
        await t.deleteTransaction(ctx);
        await t.navigateToTransactions(ctx);
        await b.expectNoId(ctx, 'TransactionCard.Label.E2E_Edited_Transfer');
        await b.expectId(ctx, 'TabBar.Home', 3_000);
        await home('100', '100');
    });
});
