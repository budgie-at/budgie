import * as a from '../support/budgie/accounts.ts';
import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import { PENDING_ANDROID_PORT, test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const DEPOSIT = 'E2E Deposit Account';

test('37 deposit lifecycle', { tags: ['accounts'], platforms: PENDING_ANDROID_PORT }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const depositCard = async () => {
        for (const row of ['Container', 'InterestRateRow', 'MaturityDateRow', 'DaysRemainingRow', 'ExpectedPayoutRow']) {
            await b.expectId(ctx, `DepositDetailsCard.${row}`);
        }
    };
    const home = async () => {
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'HomePage.TotalBalance');
    };

    await budgie.start({ fixture: '12.db' });

    await b.phase('create deposit account', async () => {
        await a.openNewAccount(ctx);
        await b.tapId(ctx, 'CreateAccount.DEPOSIT');
        await b.expectId(ctx, 'AccountForm.NameInput', 3_000);
        const amount = b.byId(screen, 'CreateAccount.Amount');
        await amount.tap();
        await amount.clear();
        await amount.fill('500');
        await b.tapId(ctx, 'AccountForm.NameInput');
        await b.fillId(ctx, 'AccountForm.NameInput', DEPOSIT);
        await a.swipeDownFromCentre(ctx, 'AccountForm.ScrollView');
        await a.setDepositTerms(ctx, '12', '20');
        await a.submitAccountFormUntil(ctx, 'HomePage.TotalBalance');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Deposit_Account.500');
        await b.expectId(ctx, 'HomePage.NetWorthValue.700');
        await a.openAccountDetails(ctx, DEPOSIT);
        await depositCard();
    });

    await b.phase('top up deposit via transfer', async () => {
        await t.openTransactionForm(ctx, 'ActionItem.Transfer', 'New Transfer');
        await b.expectId(ctx, `TransferForm.SelectedToAccount.${DEPOSIT}`);
        await t.typeDigits(ctx, '40');
        await b.tapId(ctx, 'TransferForm.FromAccount');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input');
        await a.selectAccountFromNativePicker(ctx, 'AccountPickerBottomSheet.Option.E2E Expense Source');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'AccountDetails.Page', 10_000);
    });

    await b.phase('record interest via income', async () => {
        await t.openTransactionForm(ctx, 'ActionItem.Income', 'New Income');
        await t.typeDigits(ctx, '15');
        await c.selectCategory(ctx, 'Savings');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'AccountDetails.Page', 10_000);
        await a.exitAccountDetailsToHome(ctx);
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Deposit_Account.555');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Expense_Source.60');
        await b.expectId(ctx, 'HomePage.NetWorthValue.715');
    });

    await b.phase('convert expense to new deposit', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
        await t.typeDigits(ctx, '25');
        await b.tapId(ctx, 'TransactionForm.AccountSelector');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input', 3_000);
        await b.expectId(ctx, 'AccountPickerBottomSheet.Option.E2E Expense Source', 3_000);
        await b.expectNoId(ctx, `AccountPickerBottomSheet.Option.${DEPOSIT}`);
        await a.selectAccountBySearch(ctx, 'E2E Expense Target');
        await c.selectCategory(ctx, 'Shopping');
        await t.enterComment(ctx, 'E2E Deposit Convert Expense');
        await t.submitTransactionAndWait(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Deposit_Convert_Expense', 5_000);
        await home();
        await b.expectId(ctx, 'HomePage.NetWorthValue.690');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Expense_Target.75');

        await t.navigateToTransactions(ctx);
        await b.tapId(ctx, 'TransactionCard.Label.E2E_Deposit_Convert_Expense');
        await t.openInfoConversions(ctx);
        await b.tapText(ctx, 'Start Deposit');
        await b.expectId(ctx, 'StartDeposit.FundingSummary', 5_000);
        await b.expectId(ctx, 'StartDeposit.MissingCurrencyHint');
        await a.submitAccountFormUntil(ctx, 'AccountDetails.Page', 10_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionInfo.Row.ToAccount', 5_000);
        await b.tapId(ctx, 'TransactionInfo.EditButton');
        await b.expectText(ctx, 'Edit Transfer', 5_000);
        await b.expectId(ctx, 'TransferForm.SelectedFromAccount.E2E Expense Target');
        await b.expectId(ctx, 'TransferForm.SelectedToAccount.Deposit');
        await t.editComment(ctx, 'E2E Deposit Converted Transfer');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'TransactionInfo.Row.ToAccount', 5_000);
        await b.expectText(ctx, 'E2E Deposit Converted Transfer');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionsPage.Container', 10_000);
        await home();
        await b.expectId(ctx, 'AccountCard.Balance.Deposit.25');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Expense_Target.75');
        await b.expectId(ctx, 'HomePage.NetWorthValue.715');
    });

    await b.phase('edit new deposit account', async () => {
        await a.openAccountDetails(ctx, 'Deposit');
        await b.tapId(ctx, 'AccountDetails.ActionsButton');
        await b.expectId(ctx, 'AccountDetails.EditButton', 3_000);
        await b.tapId(ctx, 'AccountDetails.EditButton');
        await b.expectId(ctx, 'AccountForm.NameInput', 3_000);
        await a.setDepositTerms(ctx, '5', '10');
        await b.tapUntil(ctx, 'AccountForm.SubmitButton', () => b.expectId(ctx, 'HomePage.TotalBalance', 15_000));
        await a.openAccountDetails(ctx, 'Deposit');
        await depositCard();
        await a.exitAccountDetailsToHome(ctx);
    });

    await b.phase('close original deposit', async () => {
        await a.openAccountDetails(ctx, DEPOSIT);
        await b.tapId(ctx, 'AccountDetails.ActionsButton');
        await b.expectId(ctx, 'AccountDetails.CloseDepositButton', 3_000);
        await b.tapId(ctx, 'AccountDetails.CloseDepositButton');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input');
        await a.selectAccountFromNativePicker(ctx, 'AccountPickerBottomSheet.Option.E2E Expense Source');
        await b.expectId(ctx, 'DepositClose.AmountInput', 10_000);
        await b.expectText(ctx, /555/);
        await b.tapId(ctx, 'DepositClose.ConfirmButton');
        await b.expectId(ctx, 'HomePage.TotalBalance', 15_000);
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Expense_Source.615');
        await b.expectId(ctx, 'HomePage.NetWorthValue.715');
        await b.expectNoId(ctx, `AccountCard.${DEPOSIT}`);
    });

    await b.phase('verify deposit archived', async () => {
        await a.openArchivedAccounts(ctx);
        await b.expectId(ctx, `ArchivedAccountCard.${DEPOSIT}`);
    });
});
