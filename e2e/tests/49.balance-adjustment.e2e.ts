import { expect } from 'e2e';

import * as accounts from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import { clearAmount, typeDigits } from '../support/budgie/transactions.ts';

const ACCOUNT = 'E2E Adjustment Account';

test('49 balance adjustment saves increase and decrease', { tags: ['accounts', 'transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '02.db' });
    await accounts.createLiabilityAccount(ctx, { typeId: 'CreateAccount.CASH', name: ACCOUNT, currency: 'CAD', amount: '250' });

    for (const adjustment of [
        { direction: 'Increase', balance: '300', amount: '300', previous: '250' },
        { direction: 'Decrease', balance: '50', amount: '50', previous: '300' }
    ]) {
        await accounts.openAccountDetails(ctx, ACCOUNT);
        await b.tapId(ctx, `TransactionCard.AdjustmentAmount.${adjustment.previous}`);
        await b.expectId(ctx, 'TransactionForm.AmountInput');
        await expect(b.byId(ctx.screen, 'Adjustment.Preview')).toHaveText('No change');
        await b.tapId(ctx, `Adjustment.${adjustment.direction}`);
        await clearAmount(ctx);
        await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
        await expect(b.byId(ctx.screen, 'Adjustment.Preview')).toHaveText('Enter an amount');
        await expect(b.byId(ctx.screen, 'Adjustment.Current')).toHaveText(`Current balance, C$${adjustment.previous}.00`);
        await expect(b.byId(ctx.screen, 'Adjustment.After')).toHaveText('After saving, —');
        await expect(b.byId(ctx.screen, 'TransactionForm.AmountInput')).toHaveText('C$0');
        await typeDigits(ctx, '0');
        await expect(b.byId(ctx.screen, 'TransactionForm.SubmitButton')).toBeDisabled();
        await expect(b.byId(ctx.screen, 'Adjustment.Preview')).toHaveText('Enter an amount');
        await typeDigits(ctx, adjustment.amount);
        const expectedPreview = adjustment.direction === 'Decrease' ? '−\u2060C$350.00 → −C$50.00' : '+\u2060C$50.00 → C$300.00';
        await expect(b.byId(ctx.screen, 'Adjustment.Preview')).toHaveText(expectedPreview);
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectNoId(ctx, 'TransactionForm.SubmitButton');
        await b.openLink(ctx, 'budgie://');
        await accounts.openAccountSettings(ctx, ACCOUNT);
        await expect(b.byId(ctx.screen, 'CreateAccount.Amount')).toHaveValue(new RegExp(`^${adjustment.balance}(\\.00)?$`));
        await expect(ctx.screen.getByRole('switch', { name: 'Balance sign' }).first()).toHaveValue(
            adjustment.direction === 'Decrease' ? '1' : '0'
        );
        await b.tapId(ctx, 'PageHeader.BackButton');
        await accounts.exitAccountDetailsToHome(ctx);
    }
});
