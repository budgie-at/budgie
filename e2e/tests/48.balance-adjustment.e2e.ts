import { expect } from 'e2e';

import * as accounts from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import { clearAmount, typeDigits } from '../support/budgie/transactions.ts';

const ACCOUNT = 'E2E Adjustment Account';

test('48 balance adjustment saves increase and decrease', { tags: ['accounts', 'transactions'] }, async ({ budgie }) => {
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
        await ctx.screen.getByText(adjustment.direction, { exact: true }).first().tap();
        await clearAmount(ctx);
        await typeDigits(ctx, adjustment.amount);
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
