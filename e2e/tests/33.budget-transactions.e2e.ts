// Port of tests/app-tests/flows/33.budget-transactions.flow.yaml.
import { expect } from 'e2e';
import * as b from '../support/budgie/core.ts';
import * as bu from '../support/budgie/budget.ts';
import {
  deleteTransaction,
  enterComment,
  navigateToTransactions,
  openInfoConversions,
  openTransactionForm,
  selectAccount,
  submitTransactionAndWait,
  typeDigits,
} from '../support/budgie/transactions.ts';
import { test } from '../support/budgie/test.ts';

const ACCOUNT = 'Rules Test Account';
const CATEGORY = 'Rules Test Category';
const UPDATE_COMMENT = 'E2E Budget Update Txn';
const UPDATE_CARD = 'TransactionCard.Label.E2E_Budget_Update_Txn';

test('33 budget transactions', { tags: ['budget'] }, async ({ budgie }) => {
  const ctx = budgie.ctx;
  const { screen } = ctx;
  const category = { id: 42, share: '' };
  const addTransaction = async (kind: 'Expense' | 'Income', digits: string, comment: string) => {
    await navigateToTransactions(ctx);
    await openTransactionForm(ctx, `ActionItem.${kind}`, `New ${kind}`);
    await typeDigits(ctx, digits);
    await selectAccount(ctx, ACCOUNT);
    await b.tapId(ctx, 'TransactionForm.CategorySelector');
    await b.selectCategoryBySearch(ctx, CATEGORY);
    await enterComment(ctx, comment);
    await submitTransactionAndWait(ctx);
  };

  // setup/setup-budget-test
  await budgie.start({ fixture: 'budget-base.db', wait: 'tabbar' });

  await b.phase('create budget with a category limit', async () => {
    await bu.openEmptyBudget(ctx);
    await bu.chooseEmptyCanvas(ctx);
    await bu.setOverallLimit(ctx, '1000');
    await bu.addCategoryLimit(ctx, CATEGORY);
    await bu.fillAmount(ctx, 'BudgetSetup.CategoryLimit.0.AmountInput', '200');
    await bu.saveBudgetSetup(ctx);
    await expect(b.byId(screen, 'BudgetWidget.SpentLabel')).toHaveText('€0 / €1,000');
    await expect(b.byId(screen, 'BudgetWidget.CategorySpentLabel.42')).toHaveText('0%');
  });

  await b.phase('expense counts', async () => {
    await addTransaction('Expense', '100', 'E2E Budget Refund Expense');
    await b.expectId(ctx, 'TransactionCard.Label.E2E_Budget_Refund_Expense', 5_000);
    await bu.expectWidgetSpent(ctx, '€100 / €1,000', { ...category, share: '50%' });
  });

  await b.phase('income does not count', async () => {
    await addTransaction('Income', '30', 'E2E Budget Refund Income');
    await bu.expectWidgetSpent(ctx, '€100 / €1,000', { ...category, share: '50%' });
  });

  await b.phase('income converted to refund reduces spending', async () => {
    await b.openLink(ctx, 'budgie://transactions/10/income');
    await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
    await openInfoConversions(ctx);
    await b.tapText(ctx, 'Convert to Refund');
    await b.expectId(ctx, 'ConvertToRefund.Page', 10_000);
    await b.expectId(ctx, 'ConvertToRefund.CandidateRow.9');
    await b.tapId(ctx, 'ConvertToRefund.CandidateRow.9');
    await b.tapId(ctx, 'ConvertToRefund.ConvertButton');
    await expect(b.byText(screen, 'Convert to Refund?')).toBeVisible({ timeout: 10_000 });
    await screen.getByText('Convert').last().tap();
    await b.expectId(ctx, 'TransactionInfo.Row.RefundSummary', 10_000);
    await b.tapId(ctx, 'PageHeader.BackButton');
    await bu.expectWidgetSpent(ctx, '€70 / €1,000', { ...category, share: '35%' }, 5_000);
  });

  await b.phase('new expense, then deleted', async () => {
    await addTransaction('Expense', '60', UPDATE_COMMENT);
    await b.expectId(ctx, UPDATE_CARD, 5_000);
    await bu.expectWidgetSpent(ctx, '€130 / €1,000', { ...category, share: '65%' });
    await navigateToTransactions(ctx);
    await b.expectId(ctx, UPDATE_CARD, 5_000);
    await b.tapId(ctx, UPDATE_CARD);
    await deleteTransaction(ctx);
    await navigateToTransactions(ctx);
    await b.expectNoId(ctx, UPDATE_CARD);
    await b.expectId(ctx, 'TabBar.Home', 3_000);
    await bu.expectWidgetSpent(ctx, '€70 / €1,000', { ...category, share: '35%' });
  });
});
