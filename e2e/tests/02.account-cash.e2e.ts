import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { PENDING_ANDROID_PORT, test } from '../support/budgie/test.ts';

const ACCOUNT = 'E2E Savings Account';

test('02 account cash', { tags: ['accounts'], platforms: PENDING_ANDROID_PORT }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '02.db' });

    await b.phase('create cash account', () =>
        a.createLiabilityAccount(ctx, { typeId: 'CreateAccount.CASH', name: ACCOUNT, currency: 'CAD', amount: '250' })
    );

    await b.phase('opening adjustment', async () => {
        await a.openAccountDetails(ctx, ACCOUNT);
        await a.assertAdjustmentTransaction(ctx, '250');
        await a.exitAccountDetailsToHome(ctx);
        await b.expectId(ctx, `AccountCard.${ACCOUNT}`);
    });

    await b.phase('update balance', async () => {
        await a.openAccountSettings(ctx, ACCOUNT);
        await a.updateAccountBalance(ctx, '123456789');
        await a.openAccountSettings(ctx, ACCOUNT);
        await expect(b.byId(ctx.screen, 'CreateAccount.Amount')).toHaveValue(/^123,456,789(\.00)?$/);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await a.exitAccountDetailsToHome(ctx);
    });
});
