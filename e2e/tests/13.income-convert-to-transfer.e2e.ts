// Port of tests/app-tests/flows/13.income-convert-to-transfer.flow.yaml.
import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import * as c from '../support/budgie/categories.ts';
import * as t from '../support/budgie/transactions.ts';
import { test } from '../support/budgie/test.ts';

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
    await b.tapId(ctx, 'TransferForm.FromAccount');
    await b.expectId(ctx, 'AccountPickerBottomSheet.Input');
    await a.selectAccountFromNativePicker(ctx, 'AccountPickerBottomSheet.Option.E2E Income Source');
    await b.tapId(ctx, 'TransactionForm.SubmitButton');
    await t.confirmConvertToTransfer(ctx);
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
