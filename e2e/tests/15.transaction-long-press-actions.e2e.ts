import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const DELETE = 'TransactionCard.Label.E2E_LongPress_Delete_Txn';
const CONVERT = 'TransactionCard.Label.E2E_LongPress_Convert_Txn';

test('15 transaction long press actions', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const home = async (netWorth: string, balances?: [string, string]) => {
        await b.expectId(ctx, 'TabBar.Home', 10_000);
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'HomePage.TotalBalance');
        await b.expectId(ctx, `HomePage.NetWorthValue.${netWorth}`);
        if (balances === undefined) {
            return;
        }
        await b.expectId(ctx, `AccountCard.Balance.E2E_Expense_Source.${balances[0]}`);
        await b.expectId(ctx, `AccountCard.Balance.E2E_Expense_Target.${balances[1]}`);
    };

    await budgie.start({ fixture: '15.db' });
    await t.navigateToTransactions(ctx);
    await b.expectId(ctx, DELETE, 5_000);

    await b.phase('long-press edit from list', async () => {
        await t.longPressEditTransaction(ctx, DELETE);
        await b.expectText(ctx, 'Edit Expense', 5_000);
        await b.expectId(ctx, 'TransactionForm.AmountInput');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionsPage.Container', 5_000);
    });

    await b.phase('long-press delete from list', async () => {
        await t.longPressDeleteTransaction(ctx, DELETE);
        await t.navigateToTransactions(ctx);
        await b.expectNoId(ctx, DELETE, 10_000);
        await home('170');
        await t.navigateToTransactions(ctx);
        await b.expectId(ctx, CONVERT, 5_000);
    });

    await b.phase('long-press convert to transfer from list', async () => {
        await t.longPressConvertToTransfer(ctx, CONVERT);
        await b.expectId(ctx, 'ConvertToTransfer.Page');
        await b.tapId(ctx, 'TransferForm.ToAccount');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input');
        await a.selectAccountFromNativePicker(ctx, 'AccountPickerBottomSheet.Option.E2E Expense Target');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectNoId(ctx, 'ConvertToTransfer.Page', 15_000);
        await b.expectId(ctx, 'TransactionsPage.Container', 15_000);
    });

    await b.phase('verify transfer created and balances', async () => {
        await b.expectId(ctx, CONVERT);
        await b.expectText(ctx, /From E2E Expense Source to E2E Expense Target/i);
        await home('200', ['70', '130']);
    });

    await b.phase('clean up: delete transfer', async () => {
        await t.navigateToTransactions(ctx);
        await b.tapId(ctx, CONVERT);
        await t.deleteTransaction(ctx);
        await t.navigateToTransactions(ctx);
        await b.expectNoId(ctx, CONVERT, 10_000);
        await home('200', ['100', '100']);
    });
});
