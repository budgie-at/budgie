import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const LABEL = 'TransactionCard.Label.E2E_Split_Expense';
const SPLIT_SUBTITLE = /, Groceries, Restaurants & Cafes, E2E Txn Account,/;

test('24 split transaction and analytics', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const home = async (amount: string) => {
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, `HomePage.NetWorthValue.${amount}`);
        await b.expectId(ctx, `AccountCard.Balance.E2E_Txn_Account.${amount}`);
    };
    const analytics = async () => {
        await b.tapId(ctx, 'TabBar.Analytics');
        await b.expectId(ctx, 'AnalyticsPage.Tab.Categories');
    };
    const amount = async (index: number, value: string, clear = false) => {
        const field = id(`SplitEntryRow.Amount.${index}`);
        await field.tap();
        if (clear) {
            await field.clear();
        }
        await field.fill(value);
    };
    const openSplitFromInfo = async () => {
        await b.tapId(ctx, 'TransactionInfo.EditButton.Label');
        await b.expectId(ctx, 'TransactionFieldIcon.Split', 5_000);
        await b.tapId(ctx, 'TransactionFieldIcon.Split');
        await b.expectId(ctx, 'SplitEntryRow.Amount.0');
    };
    const menuWithoutTransfer = async () => {
        await b.tapId(ctx, 'TransactionActionsMenu.TriggerButton');
        await b.expectId(ctx, 'TransactionActionsMenu.DeleteButton');
        await b.expectNoId(ctx, 'TransactionActionsMenu.ConvertToTransferButton');
        await t.closeMenu(ctx);
    };

    await budgie.start({ fixture: '08.db' });

    await b.phase('create split expense', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
        await t.typeDigits(ctx, '45');
        await t.selectAccount(ctx, 'E2E Txn Account');
        await t.enterComment(ctx, 'E2E Split Expense');
        await b.tapId(ctx, 'TransactionFieldIcon.Split');
        await b.expectId(ctx, 'SplitEntryRow.Amount.0');
        await amount(0, '20');
        await t.selectSplitCategory(ctx, 0, 'Groceries');
        await b.tapId(ctx, 'SplitEntries.AddItemButton');
        await b.expectId(ctx, 'SplitEntryRow.Amount.1');
        await amount(1, '25');
        await t.selectSplitCategory(ctx, 1, 'Restaurants & Cafes');
        await b.tapId(ctx, 'SplitEntries.ConfirmButton');
        await t.submitTransactionAndReturnToList(ctx);
        await b.expectId(ctx, LABEL, 5_000);
        await expect(id(LABEL)).toHaveText(SPLIT_SUBTITLE);
        await home('55');
    });

    await b.phase('category analytics and drilldown', async () => {
        await analytics();
        await b.expectId(ctx, 'StatisticsSpendingHero.Spent.45');
        await b.expectId(ctx, 'CategoryStatisticsCard.Amount.Groceries.20000000');
        await b.expectId(ctx, 'CategoryStatisticsCard.Amount.Restaurants_Cafes.25000000');
        await b.tapId(ctx, 'CategoryStatisticsCard.Groceries');
        await b.expectId(ctx, LABEL, 5_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'AnalyticsPage.Tab.Categories');
    });

    await b.phase('edit split rows', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransaction(ctx, 'E2E_Split_Expense');
        await b.scrollTo(ctx, 'TransactionActionsMenu.CreateRuleButton');
        await b.expectId(ctx, 'TransactionActionsMenu.CreateRuleButton');
        await b.expectNoId(ctx, 'TransactionActionsMenu.ConvertToTransferButton');
        await b.scrollTo(ctx, 'TransactionInfo.Amount', 'up');
        await openSplitFromInfo();
        await b.expectId(ctx, 'SplitEntries.RemoveSplitButton');
        await amount(0, '15', true);
        await amount(1, '30', true);
        await t.selectSplitCategory(ctx, 1, 'Restaurants & Cafes');
        await b.tapId(ctx, 'SplitEntries.ConfirmButton');
        await t.submitTransactionAndReturnToList(ctx);
        await b.expectId(ctx, LABEL, 5_000);
        await expect(id(LABEL)).toHaveText(SPLIT_SUBTITLE);
        await home('55');
        await analytics();
        await b.expectId(ctx, 'CategoryStatisticsCard.Amount.Groceries.15000000');
        await b.expectId(ctx, 'CategoryStatisticsCard.Amount.Restaurants_Cafes.30000000');
    });

    await b.phase('remove split from expense', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransaction(ctx, 'E2E_Split_Expense');
        await b.tapId(ctx, 'TransactionInfo.EditButton.Label');
        await b.expectId(ctx, 'TransactionFieldIcon.Split', 5_000);
        await menuWithoutTransfer();
        await b.tapId(ctx, 'TransactionFieldIcon.Split');
        await b.expectId(ctx, 'SplitEntryRow.Amount.0');
        await b.expectId(ctx, 'SplitEntries.RemoveSplitButton');
        await b.tapId(ctx, 'SplitEntries.RemoveSplitButton');
        await expect(b.byText(screen, 'Remove split?')).toBeVisible({ timeout: 10_000 });
        await screen.getByText('Remove split').last().tap();
        await expect(b.byText(screen, 'Remove split?')).toBeHidden({ timeout: 15_000 });
        await menuWithoutTransfer();
        await t.submitTransactionAndReturnToList(ctx);
        await b.expectId(ctx, LABEL, 5_000);
        await b.expectId(ctx, 'TransactionCard.Category.Groceries');
        await expect(screen.getByTestId(LABEL).filter({ hasText: SPLIT_SUBTITLE })).toBeHidden();

        await t.openTransaction(ctx, 'E2E_Split_Expense');
        await b.scrollTo(ctx, 'TransactionActionsMenu.CreateRuleButton');
        await b.expectId(ctx, 'TransactionActionsMenu.CreateRuleButton');
        await t.openInfoConversions(ctx);
        await b.expectText(ctx, 'Convert to Transfer');
        await t.closeMenu(ctx);
        await b.scrollTo(ctx, 'TransactionInfo.Amount', 'up');
        await openSplitFromInfo();
        await screen.swipe({ direction: 'down' });
        await amount(0, '15', true);
        await b.tapId(ctx, 'SplitEntries.AddItemButton');
        await b.expectId(ctx, 'SplitEntryRow.Amount.1');
        await amount(1, '30');
        await t.selectSplitCategory(ctx, 1, 'Restaurants & Cafes');
        await b.tapId(ctx, 'SplitEntries.ConfirmButton');
        await b.expectNoId(ctx, 'SplitEntries.ConfirmButton', 5_000);
        await menuWithoutTransfer();
    });

    await b.phase('delete expense', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransaction(ctx, 'E2E_Split_Expense');
        await t.deleteTransaction(ctx);
        await t.navigateToTransactions(ctx);
        await b.expectNoId(ctx, LABEL, 5_000);
        await b.expectId(ctx, 'TabBar.Home', 10_000);
        await home('100');
    });
});
