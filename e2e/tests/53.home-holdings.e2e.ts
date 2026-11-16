import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('53 home holdings hide empty assets', { tags: ['crypto'] }, async ({ budgie }) => {
    const { ctx } = budgie;
    const { screen } = ctx;

    await budgie.start({ fixture: '53-home-holdings.db' });

    await b.phase('zero and dust holdings stay off Home', async () => {
        await b.expectId(ctx, 'HomeHolding.BTC', 10_000);
        await b.expectId(ctx, 'HomeHolding.ETH');
        await b.expectNoId(ctx, 'HomeHolding.DOT');
        await b.expectNoId(ctx, 'HomeHolding.FDUSD');
    });

    await b.phase('Home lists assets only and reaches the exchange through an asset', async () => {
        await b.expectNoId(ctx, 'InstitutionRow.1');
        await b.scrollToCentered(ctx, 'HomeHolding.ETH');
        await b.tapUntil(ctx, 'HomeHolding.ETH', () => b.expectId(ctx, 'CurrencyMarket.Header.ETH', 10_000));
        await b.scrollTo(ctx, 'CurrencyMarket.Account.ETH.7');
        await b.tapUntil(ctx, 'CurrencyMarket.Account.ETH.7', () => b.expectId(ctx, 'AccountDetails.Page', 5_000));
        await expect(b.byId(screen, 'AccountDetails.InstitutionLink')).toHaveText(/Binance/, { timeout: 10_000 });
        await b.tapId(ctx, 'AccountDetails.InstitutionLink');
        await b.expectId(ctx, 'Institution.Page', 10_000);
        await b.expectId(ctx, 'AccountCard.E2E Binance DOT');
    });
});
