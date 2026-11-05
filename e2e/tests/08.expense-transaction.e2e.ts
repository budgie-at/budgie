import { expect } from 'e2e';

import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import * as g from '../support/budgie/tags.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('08 expense transaction', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const home = async (netWorth: string) => {
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, `HomePage.NetWorthValue.${netWorth}`);
    };

    await budgie.start({ fixture: '08.db' });

    await b.phase('create expense', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
        await b.expectId(ctx, 'TransactionForm.SelectedAccount.E2E_Txn_Account');
        await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
        await t.typeDigits(ctx, '42');
        await t.selectAccount(ctx, 'E2E Txn Account');
        await c.createCategoryFromTransaction(ctx, 'E2E Txn Category');

        await g.openTagPicker(ctx);
        await g.createTagInPicker(ctx, 'E2E Txn Tag');
        await g.createTagInPicker(ctx, 'E2E Txn Primary Tag');
        await id('TagPickerBottomSheet.Card.E2E Txn Primary Tag').longPress();
        await g.closeTagPicker(ctx);

        await t.enterComment(ctx, 'E2E Test Expense');
        await t.submitTransactionAndWait(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Test_Expense', 5_000);
        await expect(id('TransactionCard.Category.E2E_Txn_Category')).toHaveText('E2E Txn Category');
        await expect(id('TransactionCard.Label.E2E_Test_Expense')).toHaveText(/· E2E Txn Account,/);
        await home('58');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Txn_Account.58');
        await t.navigateToTransactions(ctx);
    });

    await b.phase('edit expense', async () => {
        await t.openTransaction(ctx, 'E2E_Test_Expense');
        await b.expectNoId(ctx, 'TransactionFeePill');
        await b.scrollTo(ctx, 'TransactionActionsMenu.CreateRuleButton');
        await b.expectId(ctx, 'TransactionInfo.ConvertButton');
        await b.expectId(ctx, 'TransactionActionsMenu.CreateRuleButton');
        await b.tapId(ctx, 'TransactionInfo.ConvertButton');
        await b.expectText(ctx, 'Add fee');
        await b.expectText(ctx, 'Attach debt');
        await b.expectText(ctx, 'Convert to Transfer');
        await b.expectText(ctx, 'Start Deposit');
        await expect(b.byText(screen, 'Convert to Refund')).toBeHidden();

        await b.tapId(ctx, 'TransactionActionsMenu.FeeButton');
        await t.openAndDismissFeeSheet(ctx, 'Edit Expense');
        await b.tapId(ctx, 'TransactionActionsMenu.TriggerButton');
        await b.expectId(ctx, 'TransactionActionsMenu.FeeButton');
        await b.expectId(ctx, 'TransactionActionsMenu.DeleteButton');
        await b.expectId(ctx, 'TransactionActionsMenu.AttachDebtSettlementButton');
        await b.expectId(ctx, 'TransactionActionsMenu.ConvertToTransferButton');
        await b.expectId(ctx, 'TransactionActionsMenu.StartDepositButton');
        await b.expectNoId(ctx, 'TransactionActionsMenu.ConvertToRefundButton');
        await b.expectNoId(ctx, 'TransactionActionsMenu.RevertButton');
        await b.tapId(ctx, 'TransactionActionsMenu.TriggerButton');

        await t.clearAmount(ctx);
        await t.typeDigits(ctx, '33');
        await c.createCategoryFromTransaction(ctx, 'E2E Edited Category');
        await t.editComment(ctx, 'E2E Edited Expense');

        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'TransactionInfo.Page', 3_000);
        await b.scrollTo(ctx, 'TransactionInfo.Row.Tags');
        await expect(id('TransactionInfo.Row.Tags')).toContainText('E2E Txn Primary Tag');
        await expect(id('TransactionInfo.Row.Tags')).toContainText('E2E Txn Tag');
        await b.tapId(ctx, 'PageHeader.BackButton');

        await b.expectId(ctx, 'TransactionCard.Label.E2E_Edited_Expense', 5_000);
        await expect(id('TransactionCard.Category.E2E_Edited_Category')).toHaveText('E2E Edited Category');
        await expect(id('TransactionCard.Label.E2E_Edited_Expense')).toHaveText(/· E2E Txn Account,/);
        await b.expectNoId(ctx, 'TransactionCard.Label.E2E_Test_Expense');
        await home('67');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Txn_Account.67');
        await t.navigateToTransactions(ctx);
    });

    await b.phase('delete expense', async () => {
        await t.openTransaction(ctx, 'E2E_Edited_Expense');
        await t.deleteTransaction(ctx);
        await t.navigateToTransactions(ctx);
        await b.expectNoId(ctx, 'TransactionCard.Label.E2E_Edited_Expense', 5_000);
        await b.expectId(ctx, 'TabBar.Home', 3_000);
        await home('100');
    });
});
