import { scrollTo } from '@mobile-ci/e2e-simlock/steps';
import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('30 crypto decimal monero account', { tags: ['accounts'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '02.db' });

    await b.phase('create monero account', () =>
        a.createCryptoAccount(ctx, { name: 'E2E Monero Ledger', amount: '22.123456', currency: 'XMR' })
    );

    await b.phase('home holding', async () => {
        await b.expectId(ctx, 'HomeHolding.XMR', 10_000);
        await b.expectId(ctx, 'HomeHolding.Value.XMR');
        await expect(b.byId(ctx.screen, 'HomeHolding.Caption.XMR')).toHaveText(/^22\.123456 XMR/);
    });

    await b.phase('market holdings', async () => {
        await b.tapId(ctx, 'HomeHolding.XMR');
        await b.expectId(ctx, 'CurrencyMarket.Holdings.XMR', 10_000);
        await b.expectText(ctx, /^22\.123456 XMR$/i);
        const heldIn = ctx.screen.getByRole('button', { name: /^E2E Monero Ledger/ }).first();
        await scrollTo(ctx.screen, heldIn);
        await heldIn.tap();
        await b.expectId(ctx, 'AccountDetails.Page', 10_000);
    });
});
